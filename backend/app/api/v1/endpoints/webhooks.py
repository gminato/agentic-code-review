from fastapi import APIRouter, Request, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.middleware.webhook_verification import verify_github_signature
from app.workers.tasks import process_review_task
from app.models.repository import Repository, Organization
from sqlalchemy import select
import json

router = APIRouter()

@router.post("/github", dependencies=[Depends(verify_github_signature)])
async def github_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event")
    
    if event_type == "pull_request":
        action = payload.get("action")
        if action in ["opened", "synchronize"]:
            pr = payload["pull_request"]
            repo_payload = payload["repository"]
            
            repo_id = repo_payload["id"]
            installation_id = payload["installation"]["id"]
            
            result = await db.execute(select(Repository).where(Repository.github_repo_id == repo_id))
            repo = result.scalars().first()
            
            if repo and repo.is_active:
                # Trigger background task for review
                process_review_task.delay(
                    repo_id=repo.id,
                    pr_number=pr["number"],
                    commit_sha=pr["head"]["sha"],
                    base_sha=pr["base"]["sha"]
                )
    
    elif event_type == "installation":
        action = payload.get("action")
        if action == "created":
            installation = payload["installation"]
            account = installation["account"]
            
            # Create or update Organization
            result = await db.execute(select(Organization).where(Organization.github_org_id == account["id"]))
            org = result.scalars().first()
            if not org:
                org = Organization(
                    github_org_id=account["id"],
                    name=account["login"]
                )
                db.add(org)
                await db.flush()
            
            # Create Repositories
            repositories = payload.get("repositories", [])
            for repo_data in repositories:
                result = await db.execute(select(Repository).where(Repository.github_repo_id == repo_data["id"]))
                repo = result.scalars().first()
                if not repo:
                    repo = Repository(
                        github_repo_id=repo_data["id"],
                        full_name=repo_data["full_name"],
                        installation_id=installation["id"],
                        organization_id=org.id
                    )
                    db.add(repo)
            
            await db.commit()

    return {"message": "Webhook received"}
