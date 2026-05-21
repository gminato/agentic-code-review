from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.api import deps
from app.db.session import get_db
from app.models.repository import Repository
from app.models.review import Review, ReviewComment
from app.schemas.dashboard import DashboardStats
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    # Total Repositories
    total_repos_result = await db.execute(select(func.count(Repository.id)))
    total_repos = total_repos_result.scalar() or 0

    # Active Repositories
    active_repos_result = await db.execute(select(func.count(Repository.id)).where(Repository.is_active == True))
    active_repos = active_repos_result.scalar() or 0

    # Total Reviews
    total_reviews_result = await db.execute(select(func.count(Review.id)))
    total_reviews = total_reviews_result.scalar() or 0

    # Reviews Today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    reviews_today_result = await db.execute(select(func.count(Review.id)).where(Review.created_at >= today_start))
    reviews_today = reviews_today_result.scalar() or 0

    # Total Findings
    total_findings_result = await db.execute(select(func.count(ReviewComment.id)))
    total_findings = total_findings_result.scalar() or 0

    # Risk Score Average
    risk_score_avg_result = await db.execute(select(func.avg(Review.risk_score)))
    risk_score_avg = risk_score_avg_result.scalar() or 0.0

    stats = DashboardStats(
        total_repositories=total_repos,
        active_repositories=active_repos,
        total_reviews=total_reviews,
        reviews_today=reviews_today,
        total_findings=total_findings,
        open_pull_requests_count=0,
        risk_score_average=float(risk_score_avg),
        health_trends=[]
    )

    if total_repos == 0:
        stats.message = "No repositories found. Please install the GitHub App and select repositories to monitor."
    
    return stats
