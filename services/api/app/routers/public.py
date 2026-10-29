import random
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.lead import Lead, LeadActivity, LeadStatus, LeadPriority, LeadSource, ActivityType
from ..models.audit import AuditLog
from ..dependencies import get_client_ip

router = APIRouter(prefix="/public", tags=["Public Integrations"])


class PublicWebLeadRequest(BaseModel):
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
    source: LeadSource = LeadSource.WEBSITE_ENQUIRY


class PublicWebLeadResponse(BaseModel):
    success: bool
    lead_code: str
    message: str


def generate_lead_code(db: Session) -> str:
    year = datetime.now().year
    for _ in range(10):
        code_num = random.randint(1000, 9999)
        code = f"JV-{year}-{code_num}"
        if not db.query(Lead).filter(Lead.lead_code == code).first():
            return code
    return f"JV-{year}-{int(datetime.now().timestamp() * 1000) % 100000}"


@router.post("/weblead", response_model=PublicWebLeadResponse, status_code=status.HTTP_201_CREATED)
def submit_web_lead(
    payload: PublicWebLeadRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    lead_code = generate_lead_code(db)
    
    lead = Lead(
        lead_code=lead_code,
        customer_name=payload.customer_name.strip(),
        customer_phone=payload.customer_phone.strip(),
        customer_email=payload.customer_email.strip() if payload.customer_email else None,
        destination=payload.destination.strip(),
        departure_city=payload.departure_city.strip() if payload.departure_city else None,
        travel_month=payload.travel_month,
        pax_adults=payload.pax_adults,
        pax_children=payload.pax_children,
        budget=payload.budget,
        travel_style=payload.travel_style,
        notes=payload.notes,
        source=payload.source,
        priority=LeadPriority.HIGH if payload.source == LeadSource.CALLBACK_MODAL else LeadPriority.MEDIUM,
        status=LeadStatus.NEW,
    )
    db.add(lead)
    db.flush()

    activity = LeadActivity(
        lead_id=lead.id,
        author_id=None,
        activity_type=ActivityType.NOTE,
        subject=f"Enquiry Received via {payload.source.value.replace('_', ' ').title()}",
        content=f"Captured from website for destination: {payload.destination}.",
    )
    db.add(activity)

    audit = AuditLog(
        user_id=None,
        user_email=None,
        action="INCOMING_WEB_LEAD",
        entity_type="lead",
        entity_id=lead.id,
        details={"lead_code": lead.lead_code, "source": payload.source.value},
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.commit()

    return PublicWebLeadResponse(
        success=True,
        lead_code=lead.lead_code,
        message="Thank you! Your travel request has been logged and assigned for review.",
    )
