from datetime import datetime, timezone, timedelta
from app.models.lead import LeadStatus, LeadPriority, LeadSource, ActivityType, TaskStatus


def test_create_lead(client, consultant_auth_headers):
    payload = {
        "customer_name": "Vikram Sethi",
        "customer_phone": "+91 9988776655",
        "customer_email": "vikram.sethi@example.com",
        "destination": "Bali Luxury Pool Villa",
        "departure_city": "Delhi",
        "travel_month": "August 2026",
        "pax_adults": 2,
        "pax_children": 0,
        "budget": "₹3,50,000",
        "travel_style": "Luxury",
        "notes": "Honeymoon booking with candle light dinner setup.",
        "source": "website_enquiry",
        "priority": "high",
    }
    response = client.post("/api/v1/leads", json=payload, headers=consultant_auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_name"] == "Vikram Sethi"
    assert data["destination"] == "Bali Luxury Pool Villa"
    assert data["lead_code"].startswith("JV-")
    assert data["status"] == "new"
    assert len(data["activities"]) >= 1
    assert data["activities"][0]["subject"] == "Lead Created"


def test_list_leads_with_filter(client, consultant_auth_headers, sample_lead):
    # Retrieve all leads
    response = client.get("/api/v1/leads", headers=consultant_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(lead["lead_code"] == sample_lead.lead_code for lead in data["items"])

    # Search filter
    search_res = client.get("/api/v1/leads?search=Rajesh", headers=consultant_auth_headers)
    assert search_res.status_code == 200
    assert search_res.json()["total"] >= 1

    # Non-matching search
    no_res = client.get("/api/v1/leads?search=NonExistentPersonXYZ", headers=consultant_auth_headers)
    assert no_res.status_code == 200
    assert no_res.json()["total"] == 0


def test_get_lead_detail(client, consultant_auth_headers, sample_lead):
    response = client.get(f"/api/v1/leads/{sample_lead.id}", headers=consultant_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_lead.id
    assert data["customer_name"] == "Rajesh Khanna"
    assert data["assigned_to_name"] == "Test Consultant"


def test_update_lead_status_and_history(client, consultant_auth_headers, sample_lead):
    # Transition status to CONTACTED
    response = client.patch(
        f"/api/v1/leads/{sample_lead.id}/status",
        json={"status": "contacted", "reason": "Called client and discussed preliminary budget"},
        headers=consultant_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "contacted"
    assert len(data["status_history"]) == 1
    assert data["status_history"][0]["old_status"] == "new"
    assert data["status_history"][0]["new_status"] == "contacted"


def test_assign_lead(client, admin_auth_headers, sample_lead, test_admin_user):
    response = client.patch(
        f"/api/v1/leads/{sample_lead.id}/assign",
        json={"assigned_to_id": test_admin_user.id},
        headers=admin_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["assigned_to_id"] == test_admin_user.id
    assert data["assigned_to_name"] == test_admin_user.full_name


def test_add_activity_and_task(client, consultant_auth_headers, sample_lead):
    # Add activity note
    act_res = client.post(
        f"/api/v1/leads/{sample_lead.id}/activities",
        json={
            "activity_type": "call",
            "subject": "Follow-up Call with Client",
            "content": "Discussed 5-star hotel options in Interlaken and Lucerne.",
        },
        headers=consultant_auth_headers,
    )
    assert act_res.status_code == 201
    act_data = act_res.json()
    assert act_data["subject"] == "Follow-up Call with Client"
    assert act_data["activity_type"] == "call"

    # Schedule follow-up task
    due = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    task_res = client.post(
        f"/api/v1/leads/{sample_lead.id}/tasks",
        json={"title": "Send finalized quotation", "due_date": due},
        headers=consultant_auth_headers,
    )
    assert task_res.status_code == 201
    task_data = task_res.json()
    assert task_data["title"] == "Send finalized quotation"
    assert task_data["status"] == "pending"

    # Complete the task
    complete_res = client.patch(
        f"/api/v1/leads/{sample_lead.id}/tasks/{task_data['id']}",
        json={"status": "completed"},
        headers=consultant_auth_headers,
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"
