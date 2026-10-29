from typing import Dict, List
from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class DashboardMetricsResponse(BaseModel):
    total_leads: int
    new_leads: int
    active_leads: int
    won_leads: int
    lost_leads: int
    overdue_followups: int
    conversion_rate: float
    pipeline_by_stage: Dict[str, int]
    leads_by_source: Dict[str, int]
