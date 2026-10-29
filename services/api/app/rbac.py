import enum
from typing import Set, Dict, List
from sqlalchemy import or_
from sqlalchemy.orm import Query
from .models.user import User, UserRole
from .models.lead import Lead


class Permission(str, enum.Enum):
    # Leads
    LEADS_VIEW_ALL = "leads:view_all"
    LEADS_VIEW_TEAM = "leads:view_team"
    LEADS_VIEW_ASSIGNED = "leads:view_assigned"
    LEADS_CREATE = "leads:create"
    LEADS_EDIT = "leads:edit"
    LEADS_ASSIGN = "leads:assign"
    LEADS_DELETE = "leads:delete"

    # Quotations & Pricing
    QUOTES_VIEW = "quotes:view"
    QUOTES_CREATE = "quotes:create"
    QUOTES_VIEW_MARGINS = "quotes:view_margins"
    QUOTES_APPROVE = "quotes:approve"

    # Customers & PII
    CUSTOMERS_VIEW = "customers:view"
    CUSTOMERS_CREATE = "customers:create"
    CUSTOMERS_EDIT = "customers:edit"
    CUSTOMERS_EXPORT_PII = "customers:export_pii"
    CUSTOMERS_DELETE = "customers:delete"

    # Tasks & Teams
    TASKS_MANAGE_TEAM = "tasks:manage_team"
    
    # Analytics & Audits
    ANALYTICS_FINANCIALS = "analytics:financials"
    ANALYTICS_TEAM = "analytics:team"

    # System & Settings
    SETTINGS_USERS = "settings:users"


ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: {perm for perm in Permission},
    
    UserRole.MANAGER: {
        Permission.LEADS_VIEW_TEAM,
        Permission.LEADS_VIEW_ASSIGNED,
        Permission.LEADS_CREATE,
        Permission.LEADS_EDIT,
        Permission.LEADS_ASSIGN,
        Permission.QUOTES_VIEW,
        Permission.QUOTES_CREATE,
        Permission.QUOTES_VIEW_MARGINS,
        Permission.QUOTES_APPROVE,
        Permission.CUSTOMERS_VIEW,
        Permission.CUSTOMERS_CREATE,
        Permission.CUSTOMERS_EDIT,
        Permission.TASKS_MANAGE_TEAM,
        Permission.ANALYTICS_TEAM,
    },
    
    UserRole.CONSULTANT: {
        Permission.LEADS_VIEW_ASSIGNED,
        Permission.LEADS_CREATE,
        Permission.LEADS_EDIT,
        Permission.QUOTES_VIEW,
        Permission.QUOTES_CREATE,
        Permission.CUSTOMERS_VIEW,
        Permission.CUSTOMERS_CREATE,
        Permission.CUSTOMERS_EDIT,
    },
    
    UserRole.OPERATIONS: {
        Permission.LEADS_VIEW_ASSIGNED,
        Permission.QUOTES_VIEW,
        Permission.CUSTOMERS_VIEW,
    },
}


def has_permission(role: UserRole, permission: Permission) -> bool:
    """Checks whether the given UserRole has a specific Permission."""
    allowed = ROLE_PERMISSIONS.get(role, set())
    return permission in allowed


def get_user_permissions(role: UserRole) -> List[str]:
    """Returns the list of string permission keys for a given UserRole."""
    return [p.value for p in ROLE_PERMISSIONS.get(role, set())]


def scope_leads_query(query: Query, user: User, db_session=None) -> Query:
    """
    Applies record-level data scoping to a Lead SQLAlchemy Query based on user role and permissions.
    - ADMIN: Full visibility across all leads.
    - MANAGER: Visibility across leads assigned to anyone in their team, or unassigned.
    - CONSULTANT: Visibility restricted to leads assigned to the user or unassigned inbound leads.
    - OPERATIONS: Visibility restricted to 'won' status deals for fulfillment, or directly assigned.
    """
    if has_permission(user.role, Permission.LEADS_VIEW_ALL):
        return query

    if has_permission(user.role, Permission.LEADS_VIEW_TEAM):
        if user.team_id and db_session:
            # Query all users in user's team
            team_user_ids = [
                u.id for u in db_session.query(User.id).filter(User.team_id == user.team_id).all()
            ]
            return query.filter(
                or_(
                    Lead.assigned_to_id.in_(team_user_ids),
                    Lead.assigned_to_id.is_(None),
                )
            )
        # Fallback if no team set: see own or unassigned
        return query.filter(or_(Lead.assigned_to_id == user.id, Lead.assigned_to_id.is_(None)))

    if user.role == UserRole.OPERATIONS:
        # Operations sees won leads for fulfillment, plus anything explicitly assigned to them
        return query.filter(or_(Lead.status == "won", Lead.assigned_to_id == user.id))

    # Default for Travel Consultant: Only assigned leads + unassigned inbound pool
    return query.filter(or_(Lead.assigned_to_id == user.id, Lead.assigned_to_id.is_(None)))


def can_access_lead(lead: Lead, user: User, db_session=None) -> bool:
    """Checks whether a user can read or interact with a specific Lead record."""
    if has_permission(user.role, Permission.LEADS_VIEW_ALL):
        return True

    # Anyone can access unassigned leads in the pool
    if lead.assigned_to_id is None:
        return True

    # Assigned consultant can access their own lead
    if lead.assigned_to_id == user.id:
        return True

    # Manager can access leads belonging to their team members
    if has_permission(user.role, Permission.LEADS_VIEW_TEAM) and user.team_id and db_session:
        assigned_user = db_session.query(User).filter(User.id == lead.assigned_to_id).first()
        if assigned_user and assigned_user.team_id == user.team_id:
            return True

    # Operations can access won leads
    if user.role == UserRole.OPERATIONS and lead.status == "won":
        return True

    return False


def mask_passport_number(passport: str | None) -> str | None:
    """
    Masks confidential traveler passport number unless caller has export permissions.
    E.g. 'T8912401' -> '****2401', 'A1234567' -> '****4567'
    """
    if not passport:
        return None
    val = passport.strip()
    if len(val) <= 4:
        return "****"
    return f"{'*' * (len(val) - 4)}{val[-4:]}"

