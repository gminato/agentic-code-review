from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class CronJob(Base):
    __tablename__ = "cron_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id"))
    cron_expression: Mapped[str] = mapped_column(String)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="cron_jobs")
    agent: Mapped["Agent"] = relationship("Agent")
