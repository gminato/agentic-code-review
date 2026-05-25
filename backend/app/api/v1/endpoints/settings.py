from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.db.session import get_db
from app.services.github_app import github_app_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class LLMConfigUpdate(BaseModel):
    provider: str = "openrouter"
    api_key: str
    model: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096

def mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 12:
        return "••••••••"
    return f"{key[:10]}••••••••{key[-4:]}"

@router.get("/installations")
async def get_installations(
    current_user = Depends(deps.get_current_user)
):
    return await github_app_service.get_installations()

@router.get("/llm")
async def get_llm_config(
    current_user = Depends(deps.get_current_user)
):
    config = current_user.llm_config or {}
    if "api_key" in config and config["api_key"]:
        masked_config = config.copy()
        masked_config["api_key"] = mask_key(config["api_key"])
        return masked_config
    return config

@router.put("/llm")
async def update_llm_config(
    config: LLMConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    existing_config = current_user.llm_config or {}
    new_config = config.model_dump()
    
    # If key is masked, preserve the existing key
    if "••••" in new_config.get("api_key", "") or new_config.get("api_key") == "":
        if existing_config.get("api_key"):
            new_config["api_key"] = existing_config["api_key"]
            
    current_user.llm_config = new_config
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    # Return masked
    masked = current_user.llm_config.copy()
    masked["api_key"] = mask_key(masked["api_key"])
    return masked
