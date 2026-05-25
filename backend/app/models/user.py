from sqlalchemy import String, Integer, BigInteger, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    github_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    username: Mapped[str] = mapped_column(String, index=True)
    email: Mapped[str] = mapped_column(String, index=True, nullable=True)
    avatar_url: Mapped[str] = mapped_column(String, nullable=True)
    github_access_token: Mapped[str] = mapped_column(String, nullable=True)
    llm_config: Mapped[dict] = mapped_column(JSON, nullable=True)
