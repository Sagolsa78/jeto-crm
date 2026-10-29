from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from ..models.lead import LeadStatus, LeadPriority, LeadSource
from .activity import ActivityResponse
from .task import TaskResponse


class LeadCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=120)
    customer_phone: str = Field(..., min_length=10, max_length=30)
    customer_email: Optional[str] = None
    destination: str
    departure_city: Optional[str] = None
    travel_month: Optional[str] = None
    pax_adults: int = Field(default=2, ge=1)
    pax_children: int = Field(default=0, ge=0)
    budget: Optional[str] = None
    travel_style: str = "Luxury"
    notes: Optional[str] = None
    source: LeadSource = LeadSource.CALLBACK_MODAL
    priority: LeadPriority = LeadPriority.MEDIUM
    assigned_to_id: Optional[str] = None


class LeadUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    destination: Optional[str] = None
    departure_city: Optional[str] = None
    travel_month: Optional[str] = None
    pax_adults: Optional[int] = None
    pax_children: Optional[int] = None
    budget: Optional[str] = None
    travel_style: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[LeadPriority] = None


class LeadStatusUpdate(BaseModel):
    status: LeadStatus
    reason: Optional[str] = None


class LeadAssignRequest(BaseModel):
    assigned_to_id: str


class LeadListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_code: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    destination: str
    travel_month: Optional[str] = None
    pax_adults: int
    pax_children: int
    budget: Optional[str] = None
    source: LeadSource
    status: LeadStatus
    priority: LeadPriority
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    next_follow_up_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class StatusHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    old_status: str
    new_status: str
    reason: Optional[str] = None
    changed_by_name: Optional[str] = None
    created_at: datetime


class LeadListResponse(BaseModel):
    items: List[LeadListItem]
    total: int


class LeadDetail(LeadListItem):
    model_config = ConfigDict(from_attributes=True)

    departure_city: Optional[str] = None
    travel_style: str
    notes: Optional[str] = None
    loss_reason: Optional[str] = None
    activities: List[ActivityResponse] = []
    tasks: List[TaskResponse] = []
    status_history: List[StatusHistoryItem] = []
