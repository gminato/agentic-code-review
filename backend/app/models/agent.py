from sqlalchemy import String, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id"))
    name: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String)
    prompt: Mapped[str] = mapped_column(String)
    config_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="agents")
