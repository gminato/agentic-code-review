import asyncio
from app.workers.celery_app import celery_app
from app.db.session import async_session_factory
from app.models.repository import Repository
from app.models.review import Review, ReviewComment
from app.services.github_app import github_app_service
from app.services.ai.orchestrator import ReviewOrchestrator
from sqlalchemy import select

from app.core.logging import logger
from app.core.exceptions import AppError

async def _process_review(repo_id: int, pr_number: int, commit_sha: str, base_sha: str):
    async with async_session_factory() as db:
        logger.info("review_started", repo_id=repo_id, pr_number=pr_number, commit_sha=commit_sha)
        result = await db.execute(select(Repository).where(Repository.id == repo_id))
        repo = result.scalars().first()
        if not repo:
            logger.error("review_failed_repo_not_found", repo_id=repo_id)
            return

        # Check if there is already a pending review for this commit
        result = await db.execute(
            select(Review).where(
                Review.repository_id == repo.id,
                Review.commit_sha == commit_sha,
                Review.status == "pending"
            ).order_by(Review.id.desc())
        )
        review = result.scalars().first()
        
        if review:
            review.status = "running"
            review.thinking_log = []
        else:
            review = Review(
                repository_id=repo.id,
                commit_sha=commit_sha,
                pr_number=pr_number,
                status="running",
                thinking_log=[]
            )
            db.add(review)
        
        await db.commit()
        await db.refresh(review)

        # Real-time thinking log callback
        async def on_thinking(agent_name: str, status: str, message: str, findings_count: dict = None):
            import datetime
            step = {
                "agent": agent_name,
                "status": status,
                "message": message,
                "findings_count": findings_count,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            # Re-fetch or update the model to avoid dirty session state issues
            current_log = list(review.thinking_log or [])
            current_log.append(step)
            review.thinking_log = current_log
            db.add(review)
            await db.commit()

        try:
            # Step 1: Initializing
            await on_thinking("System", "running", "Fetching commit diff from GitHub...")
            
            # Fetch diff
            diff = await github_app_service.get_repo_diff(
                repo.installation_id,
                repo.full_name,
                base_sha,
                commit_sha
            )
            
            if not diff:
                logger.error("review_failed_no_diff", review_id=review.id)
                await on_thinking("System", "failed", "Failed to retrieve diff from GitHub. Review aborted.")
                review.status = "failed"
                review.summary = "Failed to fetch diff from GitHub."
                await db.commit()
                return

            await on_thinking("System", "completed", "Successfully retrieved and parsed commit diff.")

            # Run Orchestrator
            orchestrator = ReviewOrchestrator()
            findings = await orchestrator.run_review(diff, on_thinking=on_thinking)
            
            # Store Findings
            await on_thinking("System", "running", f"Writing {len(findings)} findings to database and posting comments to GitHub...")
            for finding in findings:
                comment = ReviewComment(
                    review_id=review.id,
                    file_path=finding["file_path"],
                    line_number=finding["line_number"],
                    severity=finding["severity"],
                    comment=finding["comment"]
                )
                db.add(comment)
                
                # Post to GitHub
                try:
                    await github_app_service.post_review_comment(
                        repo.installation_id,
                        repo.full_name,
                        pr_number,
                        commit_sha,
                        finding["file_path"],
                        finding["line_number"],
                        finding["comment"]
                    )
                except Exception as e:
                    logger.warning("github_post_comment_failed", error=str(e), review_id=review.id)

            # Generate Summary
            summary = await orchestrator.generate_summary(findings, on_thinking=on_thinking)
            
            # Calculate Risk Score
            # In a real implementation we could parse the score from the summary,
            # or set it based on the number/severity of findings. Let's do a simple calculation:
            severity_weights = {"low": 1, "medium": 3, "high": 7, "critical": 10}
            if findings:
                total_weight = sum(severity_weights.get(f["severity"].lower(), 1) for f in findings)
                calculated_score = min(10.0, total_weight / 2.0)
            else:
                calculated_score = 0.0
            
            review.risk_score = calculated_score
            review.summary = summary
            review.status = "completed"
            
            # Post Summary Comment
            try:
                await github_app_service.post_comment(
                    repo.installation_id,
                    repo.full_name,
                    pr_number,
                    f"### AI Code Review Summary\n\n{summary}"
                )
            except Exception as e:
                logger.warning("github_post_summary_failed", error=str(e), review_id=review.id)
            
            await db.commit()
            logger.info("review_completed", review_id=review.id)

        except Exception as e:
            logger.error("review_exception", error=str(e), review_id=review.id, exc_info=True)
            await on_thinking("System", "failed", f"An unexpected error occurred: {str(e)}")
            review.status = "failed"
            review.summary = f"An unexpected error occurred: {str(e)}"
            await db.commit()
            # We don't re-raise here to prevent Celery from retrying indefinitely 
            # unless we want to implement specific retry logic.

@celery_app.task
def process_review_task(repo_id: int, pr_number: int, commit_sha: str, base_sha: str):
    asyncio.run(_process_review(repo_id, pr_number, commit_sha, base_sha))
