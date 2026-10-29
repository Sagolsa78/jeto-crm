from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from ..models.lead import TaskStatus


class TaskCreate(BaseModel):
    title: str
    due_date: datetime
    assigned_to_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: str
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    title: str
    due_date: datetime
    status: TaskStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
