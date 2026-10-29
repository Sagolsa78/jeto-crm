from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from ..models.lead import ActivityType


class ActivityCreate(BaseModel):
    activity_type: ActivityType = ActivityType.NOTE
    subject: str
    content: Optional[str] = None


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: str
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    activity_type: ActivityType
    subject: str
    content: Optional[str] = None
    created_at: datetime
