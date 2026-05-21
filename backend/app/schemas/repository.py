from typing import List, Optional
from pydantic import BaseModel

class RepositoryBase(BaseModel):
    full_name: str
    is_active: bool = True
    default_branch: str = "main"

class RepositoryUpdate(BaseModel):
    is_active: Optional[bool] = None
    default_branch: Optional[str] = None

class Repository(RepositoryBase):
    id: int
    github_repo_id: int
    installation_id: int

    class Config:
        from_attributes = True

class RepositoryImport(BaseModel):
    github_repo_id: int
    full_name: str
    installation_id: int
