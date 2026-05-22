import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db, async_session_factory
from app.models.review import Review as ReviewModel
from app.core.logging import logger

router = APIRouter()

@router.get("/reviews/{review_id}/stream")
async def stream_review_thinking(
    review_id: int,
    token: Optional[str] = Query(None)
):
    if token:
        try:
            from jose import jwt
            from app.core.config import settings
            jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            raise HTTPException(status_code=403, detail="Invalid token")

    async def event_generator():
        while True:
            try:
                async with async_session_factory() as db:
                    result = await db.execute(select(ReviewModel).where(ReviewModel.id == review_id))
                    review = result.scalars().first()
                    if not review:
                        yield f"data: {json.dumps({'error': 'Review not found'})}\n\n"
                        break
                    
                    log = review.thinking_log or []
                    status = review.status
                    summary = review.summary
                    risk_score = review.risk_score
                    comments_count = 0
                    
                    if status == "completed":
                        from sqlalchemy import func
                        from app.models.review import ReviewComment
                        count_result = await db.execute(
                            select(func.count(ReviewComment.id)).where(ReviewComment.review_id == review_id)
                        )
                        comments_count = count_result.scalar() or 0

                    yield f"data: {json.dumps({
                        'status': status,
                        'thinking_log': log,
                        'summary': summary,
                        'risk_score': risk_score,
                        'comments_count': comments_count
                    })}\n\n"
                    
                    if status in ["completed", "failed"]:
                        break
            except Exception as e:
                logger.error("stream_event_error", error=str(e), review_id=review_id)
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
                
            await asyncio.sleep(1.0)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
