from typing import Optional, Dict, Any
from pydantic import BaseModel

class AgentBase(BaseModel):
    name: str
    model: str
    prompt: str
    config_json: Optional[Dict[str, Any]] = None
    enabled: bool = True

class AgentCreate(AgentBase):
    repository_id: int

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    prompt: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None

class Agent(AgentBase):
    id: int
    repository_id: int

    class Config:
        from_attributes = True
