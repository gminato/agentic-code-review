from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import deps
from app.db.session import get_db
from app.models.cron_job import CronJob as CronJobModel
from app.schemas.cron_job import CronJob as CronJobSchema, CronJobCreate, CronJobUpdate
from typing import List

router = APIRouter()

@router.get("/", response_model=List[CronJobSchema])
async def get_cron_jobs(
    repository_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(CronJobModel).where(CronJobModel.repository_id == repository_id))
    return result.scalars().all()

@router.post("/", response_model=CronJobSchema)
async def create_cron_job(
    job_in: CronJobCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    job = CronJobModel(**job_in.model_dump())
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job

@router.patch("/{job_id}", response_model=CronJobSchema)
async def update_cron_job(
    job_id: int,
    job_in: CronJobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(CronJobModel).where(CronJobModel.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Cron Job not found")
    
    update_data = job_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    
    await db.commit()
    await db.refresh(job)
    return job

@router.delete("/{job_id}")
async def delete_cron_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(deps.get_current_user)
):
    result = await db.execute(select(CronJobModel).where(CronJobModel.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Cron Job not found")
    
    await db.delete(job)
    await db.commit()
    return {"message": "Cron Job deleted"}
