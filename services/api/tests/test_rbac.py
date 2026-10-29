import pytest
from app.models.user import User, Team, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadSource
from app.security import get_password_hash, create_access_token


@pytest.fixture
def test_manager_user(db_session):
    team = Team(name="Outbound Desk Team", description="Desk Team")
    db_session.add(team)
    db_session.flush()

    user = User(
        email="testmanager@jetovacations.com",
        hashed_password=get_password_hash("ManagerSecret123!"),
        full_name="Test Manager",
        phone="+919800000003",
        role=UserRole.MANAGER,
        is_active=True,
        team_id=team.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def manager_auth_headers(test_manager_user):
    token = create_access_token(
        subject=test_manager_user.id,
        claims={"role": test_manager_user.role.value, "email": test_manager_user.email},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_consultant_user(db_session):
    user = User(
        email="secondconsultant@jetovacations.com",
        hashed_password=get_password_hash("SecondConsultant123!"),
        full_name="Second Consultant",
        phone="+919800000004",
        role=UserRole.CONSULTANT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_consultant_headers(second_consultant_user):
    token = create_access_token(
        subject=second_consultant_user.id,
        claims={"role": second_consultant_user.role.value, "email": second_consultant_user.email},
    )
    return {"Authorization": f"Bearer {token}"}


def test_consultant_forbidden_to_assign_lead(client, consultant_auth_headers, sample_lead, test_admin_user):
    """Consultants must not have permission to allocate or reassign leads."""
    response = client.patch(
        f"/api/v1/leads/{sample_lead.id}/assign",
        json={"assigned_to_id": test_admin_user.id},
        headers=consultant_auth_headers,
    )
    assert response.status_code == 403
    assert "leads:assign" in response.json()["detail"]


def test_manager_can_assign_lead(client, db_session, test_manager_user, manager_auth_headers, sample_lead):
    """Managers have authority to allocate and reassign leads to members of their team."""
    team_consultant = User(
        email="teamconsultant@jetovacations.com",
        hashed_password=get_password_hash("TeamSecret123!"),
        full_name="Team Consultant",
        phone="+919800000099",
        role=UserRole.CONSULTANT,
        is_active=True,
        team_id=test_manager_user.team_id,
    )
    # Set sample_lead as unassigned inbound lead for manager's desk to allocate
    sample_lead.assigned_to_id = None
    db_session.add(team_consultant)
    db_session.add(sample_lead)
    db_session.commit()
    db_session.refresh(team_consultant)
    db_session.refresh(sample_lead)

    response = client.patch(
        f"/api/v1/leads/{sample_lead.id}/assign",
        json={"assigned_to_id": team_consultant.id},
        headers=manager_auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["assigned_to_id"] == team_consultant.id
    assert response.json()["assigned_to_id"] == team_consultant.id


def test_consultant_forbidden_to_delete_lead(client, consultant_auth_headers, sample_lead):
    """Consultants must not have authority to delete leads."""
    response = client.delete(
        f"/api/v1/leads/{sample_lead.id}",
        headers=consultant_auth_headers,
    )
    assert response.status_code == 403
    assert "leads:delete" in response.json()["detail"]


def test_admin_can_delete_lead(client, admin_auth_headers, sample_lead):
    """Admins hold authority to purge duplicate or spam leads."""
    response = client.delete(
        f"/api/v1/leads/{sample_lead.id}",
        headers=admin_auth_headers,
    )
    assert response.status_code == 204


def test_lead_data_scoping_between_consultants(
    client,
    db_session,
    test_consultant_user,
    consultant_auth_headers,
    second_consultant_user,
    second_consultant_headers,
):
    """
    Lead Scoping Guarantee:
    - Consultant 1 cannot view or modify private leads assigned to Consultant 2.
    - Consultant 1 can view unassigned leads in the general inbound pool.
    """
    # Lead assigned to Consultant 1
    lead_c1 = Lead(
        lead_code="JV-C1-001",
        customer_name="Client of C1",
        customer_phone="+919811100001",
        destination="Dubai Luxury",
        departure_city="Delhi",
        travel_month="Nov 2026",
        pax_adults=2,
        budget="₹3,00,000",
        source=LeadSource.WEBSITE_ENQUIRY,
        status=LeadStatus.NEW,
        priority=LeadPriority.MEDIUM,
        assigned_to_id=test_consultant_user.id,
    )
    # Lead assigned to Consultant 2
    lead_c2 = Lead(
        lead_code="JV-C2-002",
        customer_name="Private Client of C2",
        customer_phone="+919822200002",
        destination="Switzerland Alps",
        departure_city="Mumbai",
        travel_month="Dec 2026",
        pax_adults=2,
        budget="₹8,00,000",
        source=LeadSource.WEBSITE_ENQUIRY,
        status=LeadStatus.CONTACTED,
        priority=LeadPriority.HIGH,
        assigned_to_id=second_consultant_user.id,
    )
    # Unassigned Lead
    lead_unassigned = Lead(
        lead_code="JV-POOL-003",
        customer_name="Inbound Pool Client",
        customer_phone="+919833300003",
        destination="Bali Ocean View",
        departure_city="Bangalore",
        travel_month="Oct 2026",
        pax_adults=2,
        budget="₹2,50,000",
        source=LeadSource.CALLBACK_MODAL,
        status=LeadStatus.NEW,
        priority=LeadPriority.URGENT,
        assigned_to_id=None,
    )
    db_session.add_all([lead_c1, lead_c2, lead_unassigned])
    db_session.commit()

    # Consultant 1 queries detail of their own lead -> 200 OK
    res_own = client.get(f"/api/v1/leads/{lead_c1.id}", headers=consultant_auth_headers)
    assert res_own.status_code == 200
    assert res_own.json()["customer_name"] == "Client of C1"

    # Consultant 1 queries detail of unassigned lead -> 200 OK
    res_pool = client.get(f"/api/v1/leads/{lead_unassigned.id}", headers=consultant_auth_headers)
    assert res_pool.status_code == 200
    assert res_pool.json()["customer_name"] == "Inbound Pool Client"

    # Consultant 1 queries detail of Consultant 2's private lead -> 403 Forbidden!
    res_forbidden = client.get(f"/api/v1/leads/{lead_c2.id}", headers=consultant_auth_headers)
    assert res_forbidden.status_code == 403
    assert "You do not have permission to view this lead record" in res_forbidden.json()["detail"]

    # Consultant 1 lists leads -> must NOT include Consultant 2's private lead!
    res_list = client.get("/api/v1/leads", headers=consultant_auth_headers)
    assert res_list.status_code == 200
    lead_codes = [item["lead_code"] for item in res_list.json()["items"]]
    assert "JV-C1-001" in lead_codes
    assert "JV-POOL-003" in lead_codes
    assert "JV-C2-002" not in lead_codes


def test_user_response_includes_granular_permissions(client, consultant_auth_headers, admin_auth_headers):
    """Verify that UserProfile and login tokens contain the computed permissions array."""
    # Consultant profile check
    res_c = client.get("/api/v1/auth/me", headers=consultant_auth_headers)
    assert res_c.status_code == 200
    c_perms = res_c.json()["permissions"]
    assert "leads:view_assigned" in c_perms
    assert "leads:assign" not in c_perms
    assert "settings:users" not in c_perms

    # Admin profile check
    res_a = client.get("/api/v1/auth/me", headers=admin_auth_headers)
    assert res_a.status_code == 200
    a_perms = res_a.json()["permissions"]
    assert "leads:view_all" in a_perms
    assert "leads:assign" in a_perms
    assert "leads:delete" in a_perms
    assert "settings:users" in a_perms
