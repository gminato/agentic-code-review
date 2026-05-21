from fastapi import APIRouter, Depends
from app.api import deps
from app.services.github_app import github_app_service

router = APIRouter()

@router.get("/installations")
async def get_installations(
    current_user = Depends(deps.get_current_user)
):
    return await github_app_service.get_installations()
