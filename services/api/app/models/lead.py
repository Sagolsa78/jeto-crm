import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class LeadStatus(str, enum.Enum):
    NEW = "new"
    ASSIGNED = "assigned"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATING = "negotiating"
    WON = "won"
    LOST = "lost"
    JUNK = "junk"


class LeadPriority(str, enum.Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class LeadSource(str, enum.Enum):
    CALLBACK_MODAL = "callback_modal"
    WEBSITE_ENQUIRY = "website_enquiry"
    WHATSAPP = "whatsapp"
    DIRECT_CALL = "direct_call"
    REFERRAL = "referral"
    META_ADS = "meta_ads"
    OFFLINE_WALKIN = "offline_walkin"


class ActivityType(str, enum.Enum):
    NOTE = "note"
    CALL = "call"
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    STATUS_CHANGE = "status_change"
    ASSIGNMENT = "assignment"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_code = Column(String(30), unique=True, index=True, nullable=False)
    
    # Contact Information
    customer_name = Column(String(120), nullable=False)
    customer_phone = Column(String(30), index=True, nullable=False)
    customer_email = Column(String(255), nullable=True)
    
    # Requirement Details
    destination = Column(String(120), nullable=False)
    departure_city = Column(String(100), nullable=True)
    travel_month = Column(String(60), nullable=True)
    pax_adults = Column(Integer, default=2, nullable=False)
    pax_children = Column(Integer, default=0, nullable=False)
    budget = Column(String(100), nullable=True)
    travel_style = Column(String(50), default="Luxury", nullable=False)
    notes = Column(Text, nullable=True)
    
    # Pipeline & Commercial Attributes
    source = Column(Enum(LeadSource), default=LeadSource.CALLBACK_MODAL, nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, index=True, nullable=False)
    priority = Column(Enum(LeadPriority), default=LeadPriority.MEDIUM, nullable=False)
    loss_reason = Column(String(255), nullable=True)
    
    # Assignment & Next Action
    assigned_to_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    next_follow_up_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    assigned_to = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_to_id])
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadActivity.created_at)")
    tasks = relationship("LeadTask", back_populates="lead", cascade="all, delete-orphan", order_by="asc(LeadTask.due_date)")
    status_history = relationship("LeadStatusHistory", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadStatusHistory.created_at)")
    proposals = relationship("Proposal", back_populates="lead", cascade="all, delete-orphan", order_by="desc(Proposal.created_at)")

    @property
    def assigned_to_name(self):
        return self.assigned_to.full_name if self.assigned_to else None


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), index=True, nullable=False)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    activity_type = Column(Enum(ActivityType), default=ActivityType.NOTE, nullable=False)
    subject = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    lead = relationship("Lead", back_populates="activities")
    author = relationship("User", back_populates="activities")

    @property
    def author_name(self):
        return self.author.full_name if self.author else None


class LeadTask(Base):
    __tablename__ = "lead_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), index=True, nullable=False)
    assigned_to_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(200), nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    lead = relationship("Lead", back_populates="tasks")
    assigned_to = relationship("User", back_populates="tasks")

    @property
    def assigned_to_name(self):
        return self.assigned_to.full_name if self.assigned_to else None


class LeadStatusHistory(Base):
    __tablename__ = "lead_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), index=True, nullable=False)
    changed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    old_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    lead = relationship("Lead", back_populates="status_history")
    changed_by = relationship("User")

    @property
    def changed_by_name(self):
        return self.changed_by.full_name if self.changed_by else None
