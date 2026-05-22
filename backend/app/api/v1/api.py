from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, 
    webhooks, 
    repositories, 
    reviews, 
    agents, 
    cron_jobs, 
    dashboard, 
    search, 
    settings, 
    notifications,
    stream
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(cron_jobs.router, prefix="/cron-jobs", tags=["cron-jobs"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(stream.router, tags=["stream"])
