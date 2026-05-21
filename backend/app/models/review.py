from sqlalchemy import String, Integer, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
from typing import List

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id"))
    commit_sha: Mapped[str] = mapped_column(String, index=True)
    pr_number: Mapped[int] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending, running, completed, failed
    summary: Mapped[str] = mapped_column(String, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=True)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="reviews")
    comments: Mapped[List["ReviewComment"]] = relationship("ReviewComment", back_populates="review")

class ReviewComment(Base):
    __tablename__ = "review_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("reviews.id"))
    file_path: Mapped[str] = mapped_column(String)
    line_number: Mapped[int] = mapped_column(Integer)
    severity: Mapped[str] = mapped_column(String)  # low, medium, high, critical
    comment: Mapped[str] = mapped_column(String)

    review: Mapped["Review"] = relationship("Review", back_populates="comments")
