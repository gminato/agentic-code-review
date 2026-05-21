from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.db.session import get_db
from app.models.review import Review as ReviewModel
from app.schemas.review import Review as ReviewSchema, ReviewCreate
from app.workers.tasks import process_review_task
from typing import List, Optional

router = APIRouter()

@router.post("/run", response_model=ReviewSchema)
async def run_review(
    review_in: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    # Check if repo exists
    from app.models.repository import Repository
    result = await db.execute(select(Repository).where(Repository.id == review_in.repository_id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Create Review record
    review = ReviewModel(
        repository_id=review_in.repository_id,
        commit_sha=review_in.commit_sha,
        pr_number=review_in.pr_number,
        status="pending"
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    # Trigger background task
    process_review_task.delay(
        repo_id=repo.id,
        pr_number=review_in.pr_number,
        commit_sha=review_in.commit_sha,
        base_sha=review_in.base_sha
    )

    return review

@router.get("/", response_model=List[ReviewSchema])
async def get_reviews(
    repository_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    query = select(ReviewModel).options(selectinload(ReviewModel.comments))
    if repository_id:
        query = query.where(ReviewModel.repository_id == repository_id)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{review_id}", response_model=ReviewSchema)
async def get_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(ReviewModel)
        .where(ReviewModel.id == review_id)
        .options(selectinload(ReviewModel.comments))
    )
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review
