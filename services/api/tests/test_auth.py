def test_login_success(client, test_admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@jetovacations.com", "password": "AdminSecret123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testadmin@jetovacations.com"
    assert data["user"]["full_name"] == "Test Admin"


def test_login_invalid_password(client, test_admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@jetovacations.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_unknown_user(client, db_session):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@jetovacations.com", "password": "SomePassword123!"},
    )
    assert response.status_code == 401


def test_get_current_user_profile(client, test_admin_user, admin_auth_headers):
    response = client.get("/api/v1/auth/me", headers=admin_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_admin_user.id
    assert data["email"] == "testadmin@jetovacations.com"


def test_unauthorized_access_rejected(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
