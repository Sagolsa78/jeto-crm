import random
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, UserRole
from ..models.lead import (
    Lead,
    LeadActivity,
    LeadTask,
    LeadStatusHistory,
    LeadStatus,
    LeadPriority,
    LeadSource,
    ActivityType,
    TaskStatus,
)
from ..models.audit import AuditLog
from ..schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadStatusUpdate,
    LeadAssignRequest,
    LeadListItem,
    LeadListResponse,
    LeadDetail,
)
from ..schemas.activity import ActivityCreate, ActivityResponse
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse
from ..dependencies import get_current_user, get_client_ip, require_permission
from ..rbac import Permission, scope_leads_query, can_access_lead

router = APIRouter(prefix="/leads", tags=["Leads"])


def generate_lead_code(db: Session) -> str:
    year = datetime.now().year
    for _ in range(10):
        code_num = random.randint(1000, 9999)
        code = f"JV-{year}-{code_num}"
        if not db.query(Lead).filter(Lead.lead_code == code).first():
            return code
    # Fallback with timestamp millis
    return f"JV-{year}-{int(datetime.now().timestamp() * 1000) % 100000}"


@router.get("", response_model=LeadListResponse)
def list_leads(
    status: Optional[LeadStatus] = None,
    priority: Optional[LeadPriority] = None,
    source: Optional[LeadSource] = None,
    assigned_to_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Lead)
    # Apply RBAC record-level scoping
    query = scope_leads_query(query, current_user, db)

    if status:
        query = query.filter(Lead.status == status)
    if priority:
        query = query.filter(Lead.priority == priority)
    if source:
        query = query.filter(Lead.source == source)
    if assigned_to_id:
        if assigned_to_id == "unassigned":
            query = query.filter(Lead.assigned_to_id.is_(None))
        else:
            query = query.filter(Lead.assigned_to_id == assigned_to_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Lead.customer_name.ilike(term),
                Lead.customer_phone.ilike(term),
                Lead.customer_email.ilike(term),
                Lead.destination.ilike(term),
                Lead.lead_code.ilike(term),
            )
        )

    total = query.count()
    items = query.order_by(desc(Lead.created_at)).offset(skip).limit(limit).all()

    return LeadListResponse(items=items, total=total)


@router.post("", response_model=LeadDetail, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead_code = generate_lead_code(db)
    
    # Check status if assigned
    initial_status = LeadStatus.ASSIGNED if lead_in.assigned_to_id else LeadStatus.NEW

    lead = Lead(
        lead_code=lead_code,
        customer_name=lead_in.customer_name.strip(),
        customer_phone=lead_in.customer_phone.strip(),
        customer_email=lead_in.customer_email.strip() if lead_in.customer_email else None,
        destination=lead_in.destination.strip(),
        departure_city=lead_in.departure_city.strip() if lead_in.departure_city else None,
        travel_month=lead_in.travel_month,
        pax_adults=lead_in.pax_adults,
        pax_children=lead_in.pax_children,
        budget=lead_in.budget,
        travel_style=lead_in.travel_style,
        notes=lead_in.notes,
        source=lead_in.source,
        priority=lead_in.priority,
        status=initial_status,
        assigned_to_id=lead_in.assigned_to_id,
    )
    db.add(lead)
    db.flush()

    # Create creation activity
    activity = LeadActivity(
        lead_id=lead.id,
        author_id=current_user.id,
        activity_type=ActivityType.NOTE,
        subject="Lead Created",
        content=f"Lead was created by {current_user.full_name}.",
    )
    db.add(activity)

    # If assigned at creation, create assignment activity
    if lead_in.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == lead_in.assigned_to_id).first()
        assignee_name = assigned_user.full_name if assigned_user else "consultant"
        assign_activity = LeadActivity(
            lead_id=lead.id,
            author_id=current_user.id,
            activity_type=ActivityType.ASSIGNMENT,
            subject=f"Assigned to {assignee_name}",
            content=f"Initially assigned to {assignee_name} upon creation.",
        )
        db.add(assign_activity)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CREATE_LEAD",
        entity_type="lead",
        entity_id=lead.id,
        details={"lead_code": lead.lead_code, "customer_name": lead.customer_name},
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.commit()
    db.refresh(lead)

    return lead


@router.get("/{lead_id}", response_model=LeadDetail)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if not can_access_lead(lead, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this lead record",
        )
    return lead


@router.patch("/{lead_id}", response_model=LeadDetail)
def update_lead(
    lead_id: str,
    lead_in: LeadUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if not can_access_lead(lead, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this lead record",
        )

    update_data = lead_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    lead.updated_at = datetime.now(timezone.utc)
    
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="UPDATE_LEAD",
        entity_type="lead",
        entity_id=lead.id,
        details=update_data,
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/status", response_model=LeadDetail)
def update_lead_status(
    lead_id: str,
    payload: LeadStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if not can_access_lead(lead, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update status for this lead record",
        )

    old_status = lead.status.value
    new_status = payload.status.value

    if old_status != new_status:
        lead.status = payload.status
        if payload.status == LeadStatus.LOST:
            lead.loss_reason = payload.reason

        history = LeadStatusHistory(
            lead_id=lead.id,
            changed_by_id=current_user.id,
            old_status=old_status,
            new_status=new_status,
            reason=payload.reason,
        )
        db.add(history)

        activity = LeadActivity(
            lead_id=lead.id,
            author_id=current_user.id,
            activity_type=ActivityType.STATUS_CHANGE,
            subject=f"Status changed: {old_status.upper()} → {new_status.upper()}",
            content=f"Reason: {payload.reason}" if payload.reason else None,
        )
        db.add(activity)

        lead.updated_at = datetime.now(timezone.utc)
        
        audit = AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="UPDATE_LEAD_STATUS",
            entity_type="lead",
            entity_id=lead.id,
            details={"old_status": old_status, "new_status": new_status, "reason": payload.reason},
            ip_address=get_client_ip(request),
        )
        db.add(audit)
        db.commit()
        db.refresh(lead)

    return lead


@router.patch("/{lead_id}/assign", response_model=LeadDetail)
def assign_lead(
    lead_id: str,
    payload: LeadAssignRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.LEADS_ASSIGN)),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if not can_access_lead(lead, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to interact with this lead record",
        )

    assignee = db.query(User).filter(User.id == payload.assigned_to_id).first()
    if not assignee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee user not found")

    # If manager, verify lead and assignee match manager's team
    if current_user.role == UserRole.MANAGER and current_user.team_id:
        if assignee.team_id != current_user.team_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only allocate leads to consultants within their own team",
            )

    old_assignee_name = lead.assigned_to.full_name if lead.assigned_to else "Unassigned"
    lead.assigned_to_id = assignee.id

    if lead.status == LeadStatus.NEW:
        lead.status = LeadStatus.ASSIGNED

    activity = LeadActivity(
        lead_id=lead.id,
        author_id=current_user.id,
        activity_type=ActivityType.ASSIGNMENT,
        subject=f"Assigned to {assignee.full_name}",
        content=f"Reassigned from {old_assignee_name} to {assignee.full_name} by {current_user.full_name}.",
    )
    db.add(activity)

    lead.updated_at = datetime.now(timezone.utc)
    
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="ASSIGN_LEAD",
        entity_type="lead",
        entity_id=lead.id,
        details={"assigned_to_id": assignee.id, "assignee_name": assignee.full_name},
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.commit()
    db.refresh(lead)

    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.LEADS_DELETE)),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if not can_access_lead(lead, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to interact with this lead record",
        )

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DELETE_LEAD",
        entity_type="lead",
        entity_id=lead.id,
        details={"lead_code": lead.lead_code, "customer_name": lead.customer_name},
        ip_address=get_client_ip(request),
    )
    db.add(audit)
    db.delete(lead)
    db.commit()
    return None


@router.post("/{lead_id}/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def add_activity(
    lead_id: str,
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if not can_access_lead(lead, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to interact with this lead record",
        )

    activity = LeadActivity(
        lead_id=lead.id,
        author_id=current_user.id,
        activity_type=activity_in.activity_type,
        subject=activity_in.subject.strip(),
        content=activity_in.content.strip() if activity_in.content else None,
    )
    db.add(activity)
    
    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(activity)

    return activity


@router.post("/{lead_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    lead_id: str,
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    if not can_access_lead(lead, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to interact with this lead record",
        )

    assigned_to_id = task_in.assigned_to_id or lead.assigned_to_id or current_user.id

    task = LeadTask(
        lead_id=lead.id,
        assigned_to_id=assigned_to_id,
        title=task_in.title.strip(),
        due_date=task_in.due_date,
        status=TaskStatus.PENDING,
    )
    db.add(task)

    # Update lead follow-up date if it's sooner or currently unset
    if not lead.next_follow_up_at or task_in.due_date < lead.next_follow_up_at:
        lead.next_follow_up_at = task_in.due_date

    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)

    return task


@router.patch("/{lead_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    lead_id: str,
    task_id: str,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(LeadTask).filter(LeadTask.id == task_id, LeadTask.lead_id == lead_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task_in.title is not None:
        task.title = task_in.title.strip()
    if task_in.due_date is not None:
        task.due_date = task_in.due_date
    if task_in.status is not None:
        task.status = task_in.status
        if task_in.status == TaskStatus.COMPLETED:
            task.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)
    return task
