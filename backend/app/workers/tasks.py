import asyncio
from app.workers.celery_app import celery_app
from app.db.session import async_session_factory, engine
from app.models.repository import Repository
from app.models.review import Review, ReviewComment
from app.services.github_app import github_app_service
from app.services.ai.orchestrator import ReviewOrchestrator
from sqlalchemy import select
import app.db.base  # Ensures all models are registered for SQLAlchemy relationships
from app.models.user import User
from app.models.agent import Agent as AgentModel

from app.core.logging import logger
from app.core.exceptions import AppError

async def _process_review(repo_id: int, pr_number: int, commit_sha: str, base_sha: str):
    # Dispose the connection pool to ensure all database connections bind to the current event loop
    await engine.dispose()
    review_id = None
    try:
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
            review_id = review.id

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

                # Fetch active agents for this repository
                agents_result = await db.execute(
                    select(AgentModel).where(AgentModel.repository_id == repo.id, AgentModel.enabled == True)
                )
                db_agents = agents_result.scalars().all()

                # Fetch user's LLM configuration
                user_result = await db.execute(select(User).order_by(User.id.asc()))
                user = user_result.scalars().first()
                llm_config = user.llm_config if user else None

                # Run Orchestrator
                orchestrator = ReviewOrchestrator(llm_config=llm_config, db_agents=db_agents)
                findings = await orchestrator.run_review(diff, on_thinking=on_thinking)
                
                # Store Findings
                await on_thinking("System", "running", f"Writing {len(findings)} findings to database and posting comments to GitHub...")
                for finding in findings:
                    # Safely parse and sanitize line_number to avoid DataError (e.g. 'All', 'N/A')
                    raw_line = finding.get("line_number")
                    clean_line = 1
                    if raw_line is not None:
                        try:
                            # Parse string decimals or float values to integer
                            clean_line = int(float(str(raw_line).strip()))
                        except (ValueError, TypeError):
                            clean_line = 1
                    
                    if clean_line < 1:
                        clean_line = 1

                    # Prepend the active AI model name as the comment author
                    model_name = getattr(orchestrator.provider, "model", "AI Reviewer")
                    comment_with_author = f"**[{model_name}]** {finding['comment']}"

                    comment = ReviewComment(
                        review_id=review.id,
                        file_path=finding["file_path"],
                        line_number=clean_line,
                        severity=finding["severity"],
                        comment=comment_with_author
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
                            clean_line,
                            comment_with_author
                        )
                    except Exception as e:
                        logger.warning("github_post_comment_failed", error=str(e), review_id=review.id)

                # Generate Summary
                summary = await orchestrator.generate_summary(findings, on_thinking=on_thinking)
                
                # Calculate Risk Score with Severity Caps
                severity_caps = {"low": 2.0, "medium": 5.0, "high": 8.0, "critical": 10.0}
                severity_weights = {"low": 1.0, "medium": 3.0, "high": 7.0, "critical": 10.0}
                
                if findings:
                    highest_severity = "low"
                    total_weight = 0.0
                    for f in findings:
                        sev = f["severity"].lower()
                        if sev not in severity_weights:
                            sev = "low"
                        total_weight += severity_weights[sev]
                        
                        # Keep track of the highest severity found
                        if sev == "critical":
                            highest_severity = "critical"
                        elif sev == "high" and highest_severity != "critical":
                            highest_severity = "high"
                        elif sev == "medium" and highest_severity not in ("critical", "high"):
                            highest_severity = "medium"
                    
                    # Apply a cap based on the highest severity present
                    cap = severity_caps[highest_severity]
                    calculated_score = min(cap, total_weight / 2.0)
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
                await on_thinking("System", "failed", f"An unexpected error occurred during processing: {str(e)}")
                review.status = "failed"
                review.summary = f"An unexpected error occurred during processing: {str(e)}"
                await db.commit()

    except Exception as outer_e:
        logger.error("review_outer_exception", error=str(outer_e), exc_info=True)
        # Attempt to mark the review as failed in the database if review_id is known or search by commit_sha
        try:
            async with async_session_factory() as error_db:
                err_review = None
                if review_id:
                    result = await error_db.execute(select(Review).where(Review.id == review_id))
                    err_review = result.scalars().first()
                else:
                    result = await error_db.execute(
                        select(Review).where(
                            Review.repository_id == repo_id,
                            Review.commit_sha == commit_sha,
                            Review.status.in_(["pending", "running"])
                        ).order_by(Review.id.desc())
                    )
                    err_review = result.scalars().first()
                
                if err_review:
                    err_review.status = "failed"
                    err_review.summary = f"System Setup/Database Error: {str(outer_e)}"
                    import datetime
                    step = {
                        "agent": "System",
                        "status": "failed",
                        "message": f"System Setup/Database Error: {str(outer_e)}",
                        "timestamp": datetime.datetime.utcnow().isoformat()
                    }
                    current_log = list(err_review.thinking_log or [])
                    current_log.append(step)
                    err_review.thinking_log = current_log
                    await error_db.commit()
        except Exception as db_e:
            logger.error("failed_to_save_outer_error_to_db", error=str(db_e), exc_info=True)

@celery_app.task
def process_review_task(repo_id: int, pr_number: int, commit_sha: str, base_sha: str):
    asyncio.run(_process_review(repo_id, pr_number, commit_sha, base_sha))
