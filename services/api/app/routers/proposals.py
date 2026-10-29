import random
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, UserRole
from ..models.lead import Lead, LeadStatus, LeadActivity, ActivityType
from ..models.proposal import Proposal, ProposalItem, ProposalStatus, ProposalItemType
from ..models.audit import AuditLog
from ..schemas.proposal import (
    ProposalCreate,
    ProposalUpdate,
    ProposalResponse,
    ProposalListResponse,
    ProposalItemResponse,
    PublicProposalView,
)
from ..dependencies import get_current_user, get_client_ip, require_permission
from ..rbac import Permission, has_permission, can_access_lead

router = APIRouter(prefix="/proposals", tags=["Proposals & Quotations"])


def generate_proposal_code(db: Session) -> str:
    year = datetime.now().year
    for _ in range(10):
        code_num = random.randint(100, 999)
        code = f"JET-{year}-{code_num}"
        if not db.query(Proposal).filter(Proposal.proposal_code == code).first():
            return code
    return f"JET-{year}-{int(datetime.now().timestamp() * 1000) % 10000}"


def calculate_proposal_financials(
    supplier_cost: float,
    markup_percentage: float,
    tax_percentage: float,
):
    profit = supplier_cost * (markup_percentage / 100.0)
    subtotal = supplier_cost + profit
    tax = subtotal * (tax_percentage / 100.0)
    total = subtotal + tax
    requires_approval = markup_percentage < 12.0
    return {
        "profit_amount": round(profit, 2),
        "tax_amount": round(tax, 2),
        "total_client_amount": round(total, 2),
        "requires_approval": requires_approval,
    }


def serialize_proposal(prop: Proposal, current_user: Optional[User]) -> ProposalResponse:
    can_view_margins = current_user and has_permission(current_user.role, Permission.QUOTES_VIEW_MARGINS)

    items_res = []
    for it in prop.items:
        items_res.append(
            ProposalItemResponse(
                id=it.id,
                item_type=it.item_type,
                day_number=it.day_number,
                title=it.title,
                description=it.description,
                selling_price=it.selling_price,
                is_optional=it.is_optional,
                net_cost=it.net_cost if can_view_margins else None,
            )
        )

    return ProposalResponse(
        id=prop.id,
        proposal_code=prop.proposal_code,
        lead_id=prop.lead_id,
        created_by_id=prop.created_by_id,
        created_by_name=prop.created_by_name,
        title=prop.title,
        destination=prop.destination,
        nights=prop.nights,
        pax_adults=prop.pax_adults,
        pax_children=prop.pax_children,
        status=prop.status,
        valid_until=prop.valid_until,
        client_token=prop.client_token,
        total_client_amount=prop.total_client_amount,
        per_person_amount=prop.per_person_amount,
        tax_percentage=prop.tax_percentage,
        tax_amount=prop.tax_amount,
        currency=prop.currency,
        requires_approval=prop.requires_approval,
        approved_by_id=prop.approved_by_id,
        approved_by_name=prop.approved_by_name,
        notes=prop.notes,
        terms_and_conditions=prop.terms_and_conditions,
        created_at=prop.created_at,
        updated_at=prop.updated_at,
        supplier_cost=prop.supplier_cost if can_view_margins else None,
        markup_percentage=prop.markup_percentage if can_view_margins else None,
        profit_amount=prop.profit_amount if can_view_margins else None,
        items=items_res,
    )


@router.get("", response_model=ProposalListResponse)
def list_proposals(
    lead_id: Optional[str] = None,
    status: Optional[ProposalStatus] = None,
    search: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Proposal)

    if lead_id:
        query = query.filter(Proposal.lead_id == lead_id)
    if status:
        query = query.filter(Proposal.status == status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Proposal.title.ilike(term),
                Proposal.destination.ilike(term),
                Proposal.proposal_code.ilike(term),
            )
        )

    # Scoping: If consultant, filter proposals created by self or linked to leads they can access
    if current_user.role == UserRole.CONSULTANT:
        query = query.filter(
            or_(
                Proposal.created_by_id == current_user.id,
                Proposal.lead.has(Lead.assigned_to_id == current_user.id),
                Proposal.lead.has(Lead.assigned_to_id.is_(None)),
            )
        )

    total = query.count()
    items = query.order_by(desc(Proposal.created_at)).offset(skip).limit(limit).all()

    can_view_margins = has_permission(current_user.role, Permission.QUOTES_VIEW_MARGINS)
    total_val = sum(p.total_client_amount for p in items)
    avg_margin = (
        round(sum(p.markup_percentage for p in items) / len(items), 1)
        if (can_view_margins and items)
        else None
    )

    return ProposalListResponse(
        items=[serialize_proposal(p, current_user) for p in items],
        total=total,
        total_pipeline_value=total_val,
        average_margin_percentage=avg_margin,
    )


@router.post("", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(
    payload: ProposalCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.QUOTES_CREATE)),
):
    # If lead_id provided, verify lead access
    lead = None
    if payload.lead_id:
        lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked lead not found")
        if not can_access_lead(lead, current_user, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create proposal for this lead")

    proposal_code = generate_proposal_code(db)
    financials = calculate_proposal_financials(
        payload.supplier_cost,
        payload.markup_percentage,
        payload.tax_percentage,
    )

    valid_until = payload.valid_until or (datetime.now(timezone.utc) + timedelta(days=14))

    proposal = Proposal(
        proposal_code=proposal_code,
        lead_id=payload.lead_id,
        created_by_id=current_user.id,
        title=payload.title.strip(),
        destination=payload.destination.strip(),
        nights=payload.nights,
        pax_adults=payload.pax_adults,
        pax_children=payload.pax_children,
        status=ProposalStatus.DRAFT,
        valid_until=valid_until,
        supplier_cost=payload.supplier_cost,
        markup_percentage=payload.markup_percentage,
        profit_amount=financials["profit_amount"],
        tax_percentage=payload.tax_percentage,
        tax_amount=financials["tax_amount"],
        total_client_amount=financials["total_client_amount"],
        currency=payload.currency,
        requires_approval=financials["requires_approval"],
        notes=payload.notes,
        terms_and_conditions=payload.terms_and_conditions,
    )
    db.add(proposal)
    db.flush()

    for it in payload.items:
        p_item = ProposalItem(
            proposal_id=proposal.id,
            item_type=it.item_type,
            day_number=it.day_number,
            title=it.title.strip(),
            description=it.description,
            net_cost=it.net_cost,
            selling_price=it.selling_price,
            is_optional=it.is_optional,
        )
        db.add(p_item)

    if lead:
        activity = LeadActivity(
            lead_id=lead.id,
            author_id=current_user.id,
            activity_type=ActivityType.NOTE,
            subject=f"Quotation Created: {proposal.proposal_code}",
            content=f"Created proposal '{proposal.title}' for ₹{proposal.total_client_amount:,.2f}.",
        )
        db.add(activity)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_PROPOSAL",
        entity_type="proposal",
        entity_id=proposal.id,
        details={
            "proposal_code": proposal.proposal_code,
            "total_client_amount": proposal.total_client_amount,
            "requires_approval": proposal.requires_approval,
        },
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.commit()
    db.refresh(proposal)

    return serialize_proposal(proposal, current_user)


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    if proposal.lead and not can_access_lead(proposal.lead, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to linked lead's proposal")

    return serialize_proposal(proposal, current_user)


@router.patch("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: str,
    payload: ProposalUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    if proposal.lead and not can_access_lead(proposal.lead, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # If status is being transitioned to SENT, check approval requirement
    if payload.status == ProposalStatus.SENT and proposal.requires_approval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot dispatch proposal: Low-margin deal requires Desk Manager approval first",
        )

    if payload.supplier_cost is not None or payload.markup_percentage is not None or payload.tax_percentage is not None:
        cost = payload.supplier_cost if payload.supplier_cost is not None else proposal.supplier_cost
        markup = payload.markup_percentage if payload.markup_percentage is not None else proposal.markup_percentage
        tax_pct = payload.tax_percentage if payload.tax_percentage is not None else proposal.tax_percentage

        fin = calculate_proposal_financials(cost, markup, tax_pct)
        proposal.supplier_cost = cost
        proposal.markup_percentage = markup
        proposal.profit_amount = fin["profit_amount"]
        proposal.tax_percentage = tax_pct
        proposal.tax_amount = fin["tax_amount"]
        proposal.total_client_amount = fin["total_client_amount"]
        proposal.requires_approval = fin["requires_approval"]

    if payload.title is not None:
        proposal.title = payload.title.strip()
    if payload.status is not None:
        proposal.status = payload.status
        # If proposal marked SENT, update lead status to proposal_sent
        if payload.status == ProposalStatus.SENT and proposal.lead:
            proposal.lead.status = LeadStatus.PROPOSAL_SENT
    if payload.valid_until is not None:
        proposal.valid_until = payload.valid_until
    if payload.notes is not None:
        proposal.notes = payload.notes
    if payload.terms_and_conditions is not None:
        proposal.terms_and_conditions = payload.terms_and_conditions

    proposal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(proposal)

    return serialize_proposal(proposal, current_user)


@router.post("/{proposal_id}/approve", response_model=ProposalResponse)
def approve_proposal(
    proposal_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.QUOTES_APPROVE)),
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    proposal.requires_approval = False
    proposal.approved_by_id = current_user.id
    proposal.updated_at = datetime.now(timezone.utc)

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="APPROVE_PROPOSAL",
        entity_type="proposal",
        entity_id=proposal.id,
        details={"proposal_code": proposal.proposal_code},
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.commit()
    db.refresh(proposal)

    return serialize_proposal(proposal, current_user)


# ── PUBLIC CLIENT PROPOSAL ENDPOINTS (Zero PII, Zero Internal Costs) ──

@router.get("/public/{client_token}", response_model=PublicProposalView)
def get_public_proposal(
    client_token: str,
    db: Session = Depends(get_db),
):
    proposal = db.query(Proposal).filter(Proposal.client_token == client_token).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found or link has expired")

    items_res = [
        ProposalItemResponse(
            id=it.id,
            item_type=it.item_type,
            day_number=it.day_number,
            title=it.title,
            description=it.description,
            selling_price=it.selling_price,
            is_optional=it.is_optional,
            net_cost=None,  # Strictly hidden from client
        )
        for it in proposal.items
    ]

    return PublicProposalView(
        proposal_code=proposal.proposal_code,
        title=proposal.title,
        destination=proposal.destination,
        nights=proposal.nights,
        pax_adults=proposal.pax_adults,
        pax_children=proposal.pax_children,
        status=proposal.status,
        valid_until=proposal.valid_until,
        total_client_amount=proposal.total_client_amount,
        per_person_amount=proposal.per_person_amount,
        currency=proposal.currency,
        notes=proposal.notes,
        terms_and_conditions=proposal.terms_and_conditions,
        items=items_res,
    )


@router.post("/public/{client_token}/accept")
def accept_public_proposal(
    client_token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    proposal = db.query(Proposal).filter(Proposal.client_token == client_token).first()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    proposal.status = ProposalStatus.ACCEPTED
    proposal.updated_at = datetime.now(timezone.utc)

    if proposal.lead:
        # Move lead to NEGOTIATING or WON
        proposal.lead.status = LeadStatus.WON
        activity = LeadActivity(
            lead_id=proposal.lead.id,
            author_id=None,
            activity_type=ActivityType.NOTE,
            subject="Proposal Accepted Digitally",
            content=f"Client accepted proposal {proposal.proposal_code} ({proposal.title}) for ₹{proposal.total_client_amount:,.2f}.",
        )
        db.add(activity)

    audit = AuditLog(
        user_id="public_client",
        user_email="public_client",
        action="ACCEPT_PROPOSAL",
        entity_type="proposal",
        entity_id=proposal.id,
        details={"proposal_code": proposal.proposal_code},
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"Proposal {proposal.proposal_code} accepted successfully. The Jeto Vacations travel team will reach out with your booking voucher.",
        "proposal_code": proposal.proposal_code,
    }
