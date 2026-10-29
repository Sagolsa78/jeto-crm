import os
import sys
import pytest

# Ensure api directory is in python sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.user import User, Team, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority, LeadSource
from app.security import get_password_hash, create_access_token

# In-memory SQLite engine for fast, isolated tests
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin_user(db_session):
    user = User(
        email="testadmin@jetovacations.com",
        hashed_password=get_password_hash("AdminSecret123!"),
        full_name="Test Admin",
        phone="+919800000001",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_consultant_user(db_session):
    user = User(
        email="testconsultant@jetovacations.com",
        hashed_password=get_password_hash("ConsultantSecret123!"),
        full_name="Test Consultant",
        phone="+919800000002",
        role=UserRole.CONSULTANT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_auth_headers(test_admin_user):
    token = create_access_token(
        subject=test_admin_user.id,
        claims={"role": test_admin_user.role.value, "email": test_admin_user.email},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def consultant_auth_headers(test_consultant_user):
    token = create_access_token(
        subject=test_consultant_user.id,
        claims={"role": test_consultant_user.role.value, "email": test_consultant_user.email},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_lead(db_session, test_consultant_user):
    lead = Lead(
        lead_code="JV-2026-TEST",
        customer_name="Rajesh Khanna",
        customer_phone="+91 98765 43210",
        customer_email="rajesh.khanna@example.com",
        destination="Switzerland Scenic Alps",
        departure_city="Mumbai",
        travel_month="May 2026",
        pax_adults=2,
        pax_children=1,
        budget="₹5,00,000",
        travel_style="Luxury",
        notes="High floor rooms requested.",
        source=LeadSource.CALLBACK_MODAL,
        status=LeadStatus.NEW,
        priority=LeadPriority.HIGH,
        assigned_to_id=test_consultant_user.id,
    )
    db_session.add(lead)
    db_session.commit()
    db_session.refresh(lead)
    return lead
