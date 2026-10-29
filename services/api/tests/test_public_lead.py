def test_submit_public_weblead(client):
    payload = {
        "customer_name": "Aakash Verma",
        "customer_phone": "+91 99999 88888",
        "customer_email": "aakash.verma@example.com",
        "destination": "Kashmir Paradise 5N",
        "departure_city": "Delhi",
        "travel_month": "May 2026",
        "pax_adults": 2,
        "pax_children": 0,
        "budget": "₹1,50,000",
        "source": "website_enquiry",
        "notes": "Looking for houseboat stay in Dal lake.",
    }
    response = client.post("/api/v1/public/weblead", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["lead_code"].startswith("JV-")


def test_submit_public_weblead_validation_error(client):
    # Missing required destination and phone too short
    payload = {
        "customer_name": "A",
        "customer_phone": "123",
    }
    response = client.post("/api/v1/public/weblead", json=payload)
    assert response.status_code == 422
