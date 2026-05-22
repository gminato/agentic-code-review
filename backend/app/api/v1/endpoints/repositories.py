from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.db.session import get_db
from app.models.repository import Repository as RepoModel
from app.schemas.repository import Repository as RepoSchema, RepositoryUpdate, RepositoryImport
from app.services.github_app import github_app_service
from typing import List

router = APIRouter()

@router.get("/available")
async def get_available_repositories(
    current_user = Depends(deps.get_current_user)
):
    if not current_user.github_access_token:
        raise HTTPException(status_code=401, detail="GitHub account not connected")
    
    installations = await github_app_service.get_user_installations(current_user.github_access_token)
    
    all_repos = []
    for inst in installations:
        inst_id = inst["id"]
        repos = await github_app_service.get_user_installation_repositories(current_user.github_access_token, inst_id)
        for r in repos:
            all_repos.append({
                "github_repo_id": r["id"],
                "full_name": r["full_name"],
                "installation_id": inst_id,
                "description": r.get("description"),
                "private": r.get("private"),
                "html_url": r.get("html_url")
            })
    
    return all_repos

@router.post("/import", response_model=RepoSchema)
async def import_repository(
    repo_import: RepositoryImport,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    # Check if already exists
    result = await db.execute(select(RepoModel).where(RepoModel.github_repo_id == repo_import.github_repo_id))
    existing = result.scalars().first()
    if existing:
        return existing
    
    new_repo = RepoModel(
        github_repo_id=repo_import.github_repo_id,
        full_name=repo_import.full_name,
        installation_id=repo_import.installation_id,
        is_active=True
    )
    db.add(new_repo)
    await db.commit()
    await db.refresh(new_repo)
    return new_repo

@router.get("/", response_model=List[RepoSchema])
async def get_repositories(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    # In a real app, you'd filter by the user's organizations
    result = await db.execute(select(RepoModel))
    return result.scalars().all()

@router.get("/{repo_id}", response_model=RepoSchema)
async def get_repository(
    repo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(RepoModel).where(RepoModel.id == repo_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo

@router.patch("/{repo_id}", response_model=RepoSchema)
async def update_repository(
    repo_id: int,
    repo_in: RepositoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(RepoModel).where(RepoModel.id == repo_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    update_data = repo_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(repo, field, value)
    
    await db.commit()
    await db.refresh(repo)
    return repo

@router.get("/{repo_id}/pull-requests")
async def get_repository_pull_requests(
    repo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(RepoModel).where(RepoModel.id == repo_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Proxy pull requests from GitHub
    prs = await github_app_service.get_pull_requests(repo.installation_id, repo.full_name)
    return prs

@router.get("/{repo_id}/pulls/{pr_number}/files")
async def get_pull_request_files(
    repo_id: int,
    pr_number: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(RepoModel).where(RepoModel.id == repo_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    files = await github_app_service.get_pull_request_files(repo.installation_id, repo.full_name, pr_number)
    return files
