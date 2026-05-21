from sqlalchemy import String, Integer, BigInteger, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
from typing import List

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    github_org_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)

    repositories: Mapped[List["Repository"]] = relationship("Repository", back_populates="organization")

class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    github_repo_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String, index=True)
    installation_id: Mapped[int] = mapped_column(BigInteger)
    default_branch: Mapped[str] = mapped_column(String, default="main")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="repositories")
    agents: Mapped[List["Agent"]] = relationship("Agent", back_populates="repository")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="repository")
    cron_jobs: Mapped[List["CronJob"]] = relationship("CronJob", back_populates="repository")
