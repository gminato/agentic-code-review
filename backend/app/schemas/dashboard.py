from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardStats(BaseModel):
    total_repositories: int
    active_repositories: int
    total_reviews: int
    reviews_today: int
    total_findings: int
    open_pull_requests_count: int = 0
    risk_score_average: float
    health_trends: List[Dict[str, Any]] = []
    message: Optional[str] = None
