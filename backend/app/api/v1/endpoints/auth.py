from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import Token, User as UserSchema
from app.services.github_oauth import github_oauth_service
import secrets

router = APIRouter()

@router.get("/github/login")
def github_login():
    state = secrets.token_urlsafe(16)
    # In a real app, you'd store 'state' in a session or cookie to verify in callback
    return RedirectResponse(github_oauth_service.get_login_url(state))

@router.get("/github/callback", response_model=Token)
async def github_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db)
):
    access_token = await github_oauth_service.get_access_token(code)
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to get GitHub access token")
    
    user_info = await github_oauth_service.get_user_info(access_token)
    emails = await github_oauth_service.get_user_emails(access_token)
    
    primary_email = None
    if isinstance(emails, list):
        primary_email = next((e["email"] for e in emails if isinstance(e, dict) and e.get("primary")), None)
    
    github_id = user_info.get("id")
    if not github_id:
        raise HTTPException(status_code=400, detail="Failed to get user info from GitHub")
    
    username = user_info.get("login")
    avatar_url = user_info.get("avatar_url")
    
    result = await db.execute(select(User).where(User.github_id == github_id))
    user = result.scalars().first()
    
    if not user:
        user = User(
            github_id=github_id,
            username=username,
            email=primary_email,
            avatar_url=avatar_url,
            github_access_token=access_token
        )
        db.add(user)
        await db.flush()
    else:
        user.username = username
        user.email = primary_email
        user.avatar_url = avatar_url
        user.github_access_token = access_token
    
    await db.commit()
    await db.refresh(user)
    
    jwt_token = security.create_access_token(user.id)
    return {"access_token": jwt_token, "token_type": "bearer"}

@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(deps.get_current_user)):
    return current_user

@router.post("/logout")
async def logout():
    # Since we use JWT, logout is usually handled by the client by deleting the token.
    # We could implement a token blacklist in Redis if needed.
    return {"message": "Successfully logged out"}
