import pytest
from app.models.user import User, Team, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadSource
from app.models.proposal import Proposal, ProposalStatus, ProposalItemType
from app.security import get_password_hash, create_access_token


@pytest.fixture
def manager_user(db_session):
    team = Team(name="Luxury Sales Desk", description="Sales Desk")
    db_session.add(team)
    db_session.flush()

    user = User(
        email="deskmanager@jetovacations.com",
        hashed_password=get_password_hash("Manager123!"),
        full_name="Desk Manager",
        role=UserRole.MANAGER,
        is_active=True,
        team_id=team.id,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def manager_headers(manager_user):
    token = create_access_token(
        subject=manager_user.id,
        claims={"role": manager_user.role.value, "email": manager_user.email},
    )
    return {"Authorization": f"Bearer {token}"}


def test_create_proposal_and_financial_masking(client, db_session, consultant_auth_headers, sample_lead):
    """
    CPQ Verification:
    - Calculates totals accurately.
    - Masks confidential margins and supplier costs for consultants.
    """
    payload = {
        "lead_id": sample_lead.id,
        "title": "Swiss Alps 7-Night Scenic Glacier & Interlaken",
        "destination": "Switzerland",
        "nights": 7,
        "pax_adults": 2,
        "pax_children": 0,
        "supplier_cost": 400000.0,
        "markup_percentage": 18.0,
        "tax_percentage": 5.0,
        "currency": "INR",
        "notes": "Includes 1st class Swiss Pass.",
        "items": [
            {
                "item_type": "hotel",
                "day_number": 1,
                "title": "Victoria Jungfrau Grand Hotel & Spa",
                "description": "Superior Double Alpine View",
                "net_cost": 150000.0,
                "selling_price": 180000.0,
                "is_optional": False,
            },
            {
                "item_type": "activity",
                "day_number": 3,
                "title": "Glacier Express Excellence Class",
                "description": "Panoramic seat reservation with 5-course gourmet lunch",
                "net_cost": 50000.0,
                "selling_price": 65000.0,
                "is_optional": False,
            },
        ],
    }

    # 1. Create Proposal as Consultant
    res = client.post("/api/v1/proposals", json=payload, headers=consultant_auth_headers)
    assert res.status_code == 201
    data = res.json()

    assert data["proposal_code"].startswith("JET-")
    assert data["status"] == "draft"
    assert data["destination"] == "Switzerland"
    
    # Financial calculations check:
    # Supplier: 400,000, 18% markup = 72,000 profit -> Subtotal: 472,000
    # 5% tax = 23,600 -> Total: 495,600
    assert data["total_client_amount"] == 495600.0
    assert data["tax_amount"] == 23600.0
    assert data["per_person_amount"] == 247800.0

    # Role-Gating: Consultant MUST NOT see supplier cost or profit amounts
    assert data["supplier_cost"] is None
    assert data["markup_percentage"] is None
    assert data["profit_amount"] is None
    assert data["items"][0]["net_cost"] is None
    assert data["items"][0]["selling_price"] == 180000.0


def test_manager_can_view_confidential_margins(
    client,
    db_session,
    consultant_auth_headers,
    manager_headers,
    manager_user,
    sample_lead,
    test_consultant_user,
):
    """Managers holding quotes:view_margins can inspect internal costs and profit."""
    # Ensure consultant belongs to manager's sales desk team
    test_consultant_user.team_id = manager_user.team_id
    db_session.add(test_consultant_user)
    db_session.commit()

    payload = {
        "lead_id": sample_lead.id,
        "title": "Bali Luxury Pool Villa Honeymoon",
        "destination": "Bali",
        "nights": 6,
        "pax_adults": 2,
        "supplier_cost": 200000.0,
        "markup_percentage": 20.0,
        "tax_percentage": 5.0,
        "currency": "INR",
    }
    create_res = client.post("/api/v1/proposals", json=payload, headers=consultant_auth_headers)
    assert create_res.status_code == 201
    prop_id = create_res.json()["id"]

    # Manager fetches proposal
    mgr_res = client.get(f"/api/v1/proposals/{prop_id}", headers=manager_headers)
    assert mgr_res.status_code == 200
    mgr_data = mgr_res.json()

    # Confidential financial attributes visible to manager:
    assert mgr_data["supplier_cost"] == 200000.0
    assert mgr_data["markup_percentage"] == 20.0
    assert mgr_data["profit_amount"] == 40000.0
    assert mgr_data["total_client_amount"] == 252000.0


def test_low_margin_requires_approval_and_manager_approves(
    client,
    db_session,
    consultant_auth_headers,
    manager_headers,
    sample_lead,
):
    """
    Margin Guardrail:
    - Deals below 12% require manager approval.
    - Consultant cannot dispatch until approved.
    - Manager can approve.
    """
    payload = {
        "lead_id": sample_lead.id,
        "title": "Discounted Kashmir Package",
        "destination": "Kashmir",
        "supplier_cost": 100000.0,
        "markup_percentage": 8.0,  # Below 12% threshold!
        "tax_percentage": 5.0,
    }
    create_res = client.post("/api/v1/proposals", json=payload, headers=consultant_auth_headers)
    assert create_res.status_code == 201
    prop = create_res.json()
    assert prop["requires_approval"] is True

    # Consultant attempts to mark proposal as SENT -> Rejected!
    dispatch_res = client.patch(
        f"/api/v1/proposals/{prop['id']}",
        json={"status": "sent"},
        headers=consultant_auth_headers,
    )
    assert dispatch_res.status_code == 400
    assert "Desk Manager approval" in dispatch_res.json()["detail"]

    # Manager approves the low-margin deal
    approve_res = client.post(f"/api/v1/proposals/{prop['id']}/approve", headers=manager_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["requires_approval"] is False

    # Now proposal can be sent
    sent_res = client.patch(
        f"/api/v1/proposals/{prop['id']}",
        json={"status": "sent"},
        headers=consultant_auth_headers,
    )
    assert sent_res.status_code == 200
    assert sent_res.json()["status"] == "sent"


def test_public_client_proposal_view_and_digital_acceptance(
    client,
    consultant_auth_headers,
    sample_lead,
    db_session,
):
    """
    Client-Facing Proposal Portal:
    - Zero authentication needed (public token).
    - Zero supplier costs or internal notes exposed.
    - Client can accept digitally, updating lead to WON.
    """
    payload = {
        "lead_id": sample_lead.id,
        "title": "Dubai Ultra Luxury Atlantis & Yacht Experience",
        "destination": "Dubai",
        "nights": 5,
        "pax_adults": 2,
        "supplier_cost": 500000.0,
        "markup_percentage": 15.0,
        "tax_percentage": 5.0,
        "notes": "Client requested halal vegetarian breakfast.",
        "items": [
            {
                "item_type": "hotel",
                "title": "Atlantis The Royal - Sky Pool Villa",
                "selling_price": 450000.0,
            }
        ],
    }
    create_res = client.post("/api/v1/proposals", json=payload, headers=consultant_auth_headers)
    assert create_res.status_code == 201
    client_token = create_res.json()["client_token"]
    assert len(client_token) > 10

    # Public client accesses proposal link without auth header:
    pub_res = client.get(f"/api/v1/proposals/public/{client_token}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()

    assert pub_data["title"] == "Dubai Ultra Luxury Atlantis & Yacht Experience"
    assert pub_data["destination"] == "Dubai"
    assert pub_data["total_client_amount"] == 603750.0  # (500k + 75k) * 1.05
    assert pub_data["per_person_amount"] == 301875.0
    assert "supplier_cost" not in pub_data  # Guaranteed zero leakage
    assert "markup_percentage" not in pub_data

    # Client digitally accepts proposal:
    accept_res = client.post(f"/api/v1/proposals/public/{client_token}/accept")
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "success"

    # Verify linked lead has moved to WON:
    lead_check = client.get(f"/api/v1/leads/{sample_lead.id}", headers=consultant_auth_headers)
    assert lead_check.status_code == 200
    assert lead_check.json()["status"] == "won"
