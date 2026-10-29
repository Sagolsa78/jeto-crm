from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from ..models.proposal import ProposalStatus, ProposalItemType


class ProposalItemCreate(BaseModel):
    item_type: ProposalItemType = ProposalItemType.ACTIVITY
    day_number: Optional[int] = None
    title: str = Field(min_length=2, max_length=255)
    description: Optional[str] = None
    net_cost: float = Field(default=0.0, ge=0.0)
    selling_price: float = Field(default=0.0, ge=0.0)
    is_optional: bool = False


class ProposalItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    item_type: ProposalItemType
    day_number: Optional[int] = None
    title: str
    description: Optional[str] = None
    selling_price: float
    is_optional: bool
    # Confidential supplier cost: masked to None for non-managers
    net_cost: Optional[float] = None


class ProposalCreate(BaseModel):
    lead_id: Optional[str] = None
    title: str = Field(min_length=3, max_length=255)
    destination: str = Field(min_length=2, max_length=120)
    nights: int = Field(default=5, ge=1, le=60)
    pax_adults: int = Field(default=2, ge=1, le=50)
    pax_children: int = Field(default=0, ge=0, le=50)
    supplier_cost: float = Field(default=0.0, ge=0.0)
    markup_percentage: float = Field(default=18.0, ge=0.0, le=100.0)
    tax_percentage: float = Field(default=5.0, ge=0.0, le=28.0)
    currency: str = "INR"
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    items: List[ProposalItemCreate] = []


class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[ProposalStatus] = None
    supplier_cost: Optional[float] = None
    markup_percentage: Optional[float] = None
    tax_percentage: Optional[float] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class ProposalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    proposal_code: str
    lead_id: Optional[str] = None
    created_by_id: Optional[str] = None
    created_by_name: Optional[str] = None
    title: str
    destination: str
    nights: int
    pax_adults: int
    pax_children: int
    status: ProposalStatus
    valid_until: Optional[datetime] = None
    client_token: str
    total_client_amount: float
    per_person_amount: float
    tax_percentage: float
    tax_amount: float
    currency: str
    requires_approval: bool
    approved_by_id: Optional[str] = None
    approved_by_name: Optional[str] = None
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Role-Gated Financial Protection Fields:
    # Populated only if caller has QUOTES_VIEW_MARGINS (Admin or Manager). Masked to None for consultants.
    supplier_cost: Optional[float] = None
    markup_percentage: Optional[float] = None
    profit_amount: Optional[float] = None

    items: List[ProposalItemResponse] = []


class ProposalListResponse(BaseModel):
    items: List[ProposalResponse]
    total: int
    total_pipeline_value: float
    # Confidential aggregate: masked to None if caller cannot view margins
    average_margin_percentage: Optional[float] = None


class PublicProposalView(BaseModel):
    """Zero-PII, zero-supplier-cost client view for public link inspection."""
    proposal_code: str
    title: str
    destination: str
    nights: int
    pax_adults: int
    pax_children: int
    status: ProposalStatus
    valid_until: Optional[datetime] = None
    total_client_amount: float
    per_person_amount: float
    currency: str
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    items: List[ProposalItemResponse] = []
