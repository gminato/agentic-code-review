from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.api import deps
from app.db.session import get_db
from app.models.repository import Repository
from app.models.review import Review
from typing import List, Dict, Any

router = APIRouter()

@router.get("/")
async def search(
    q: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    # Search repositories
    repo_result = await db.execute(
        select(Repository).where(Repository.full_name.ilike(f"%{q}%"))
    )
    repos = repo_result.scalars().all()

    # Search reviews
    review_result = await db.execute(
        select(Review).where(or_(
            Review.commit_sha.ilike(f"%{q}%"),
            Review.summary.ilike(f"%{q}%")
        ))
    )
    reviews = review_result.scalars().all()

    return {
        "repositories": repos,
        "reviews": reviews
    }
