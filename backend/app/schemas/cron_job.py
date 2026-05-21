from typing import Optional
from pydantic import BaseModel

class CronJobBase(BaseModel):
    cron_expression: str
    enabled: bool = True

class CronJobCreate(CronJobBase):
    repository_id: int
    agent_id: int

class CronJobUpdate(BaseModel):
    cron_expression: Optional[str] = None
    agent_id: Optional[int] = None
    enabled: Optional[bool] = None

class CronJob(CronJobBase):
    id: int
    repository_id: int
    agent_id: int

    class Config:
        from_attributes = True
