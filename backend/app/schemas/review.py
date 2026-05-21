from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class ReviewCommentBase(BaseModel):
    file_path: str
    line_number: int
    severity: str
    comment: str

class ReviewComment(ReviewCommentBase):
    id: int
    review_id: int

    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    commit_sha: str
    pr_number: Optional[int] = None
    status: str
    summary: Optional[str] = None
    risk_score: Optional[float] = None

class Review(ReviewBase):
    id: int
    repository_id: int
    created_at: datetime
    comments: List[ReviewComment] = []

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    repository_id: int
    commit_sha: str
    pr_number: Optional[int] = None
    base_sha: str
