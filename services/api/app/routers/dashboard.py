from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.lead import Lead, LeadTask, LeadStatus, LeadSource, TaskStatus
from ..schemas.dashboard import DashboardMetricsResponse
from ..dependencies import get_current_user
from ..rbac import scope_leads_query

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    # Scoped lead query based on RBAC
    scoped_leads = scope_leads_query(db.query(Lead), current_user, db).subquery()

    # Status counts
    status_counts = (
        db.query(scoped_leads.c.status, func.count(scoped_leads.c.id))
        .group_by(scoped_leads.c.status)
        .all()
    )
    status_dict = {s.value: 0 for s in LeadStatus}
    for st, count in status_counts:
        key = st.value if hasattr(st, "value") else str(st)
        status_dict[key] = count

    # Source counts
    source_counts = (
        db.query(scoped_leads.c.source, func.count(scoped_leads.c.id))
        .group_by(scoped_leads.c.source)
        .all()
    )
    source_dict = {src.value: 0 for src in LeadSource}
    for src, count in source_counts:
        key = src.value if hasattr(src, "value") else str(src)
        source_dict[key] = count

    total_leads = sum(status_dict.values())
    new_leads = status_dict.get(LeadStatus.NEW.value, 0)
    won_leads = status_dict.get(LeadStatus.WON.value, 0)
    lost_leads = status_dict.get(LeadStatus.LOST.value, 0)
    
    active_statuses = [
        LeadStatus.ASSIGNED.value,
        LeadStatus.CONTACTED.value,
        LeadStatus.QUALIFIED.value,
        LeadStatus.PROPOSAL_SENT.value,
        LeadStatus.NEGOTIATING.value,
    ]
    active_leads = sum(status_dict.get(st, 0) for st in active_statuses)

    # Scoped Overdue tasks
    task_query = db.query(func.count(LeadTask.id)).join(Lead, LeadTask.lead_id == Lead.id)
    task_query = scope_leads_query(task_query, current_user, db).filter(
        LeadTask.status == TaskStatus.PENDING,
        LeadTask.due_date < now,
    )
    overdue_followups = task_query.scalar() or 0

    completed_deals = won_leads + lost_leads
    conversion_rate = round((won_leads / completed_deals * 100), 1) if completed_deals > 0 else 0.0

    return DashboardMetricsResponse(
        total_leads=total_leads,
        new_leads=new_leads,
        active_leads=active_leads,
        won_leads=won_leads,
        lost_leads=lost_leads,
        overdue_followups=overdue_followups,
        conversion_rate=conversion_rate,
        pipeline_by_stage=status_dict,
        leads_by_source=source_dict,
    )
