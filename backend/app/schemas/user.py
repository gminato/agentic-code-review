from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    github_id: int

class UserUpdate(UserBase):
    pass

class UserInDBBase(UserBase):
    id: int
    github_id: int

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass
