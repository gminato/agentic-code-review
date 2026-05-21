from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.db.session import get_db
from app.models.notification import Notification as NotificationModel
from app.schemas.notification import Notification as NotificationSchema
from typing import List

router = APIRouter()

@router.get("/", response_model=List[NotificationSchema])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(NotificationModel)
        .where(NotificationModel.user_id == current_user.id)
        .order_by(NotificationModel.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(NotificationModel)
        .where(NotificationModel.id == notification_id, NotificationModel.user_id == current_user.id)
    )
    notification = result.scalars().first()
    if notification:
        notification.is_read = True
        await db.commit()
    return {"message": "Notification marked as read"}
