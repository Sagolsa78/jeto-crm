def test_dashboard_metrics(client, consultant_auth_headers, sample_lead):
    response = client.get("/api/v1/dashboard/metrics", headers=consultant_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_leads" in data
    assert data["total_leads"] >= 1
    assert "pipeline_by_stage" in data
    assert "leads_by_source" in data
    assert isinstance(data["conversion_rate"], float)
