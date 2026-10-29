import enum
import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class ProposalStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ProposalItemType(str, enum.Enum):
    HOTEL = "hotel"
    FLIGHT = "flight"
    TRANSFER = "transfer"
    ACTIVITY = "activity"
    VISA = "visa"
    INSURANCE = "insurance"


def generate_client_token() -> str:
    return secrets.token_urlsafe(24)


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_code = Column(String(30), unique=True, index=True, nullable=False)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    destination = Column(String(120), nullable=False)
    nights = Column(Integer, default=5, nullable=False)
    pax_adults = Column(Integer, default=2, nullable=False)
    pax_children = Column(Integer, default=0, nullable=False)
    
    status = Column(Enum(ProposalStatus), default=ProposalStatus.DRAFT, index=True, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    client_token = Column(String(64), unique=True, index=True, default=generate_client_token, nullable=False)
    
    # Financials (Confidential Supplier & Margin attributes)
    supplier_cost = Column(Float, default=0.0, nullable=False)
    markup_percentage = Column(Float, default=18.0, nullable=False)
    profit_amount = Column(Float, default=0.0, nullable=False)
    tax_percentage = Column(Float, default=5.0, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    total_client_amount = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    # Manager Approval Guardrail (required if markup < 12%)
    requires_approval = Column(Boolean, default=False, nullable=False)
    approved_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    notes = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    lead = relationship("Lead", back_populates="proposals")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    items = relationship(
        "ProposalItem",
        back_populates="proposal",
        cascade="all, delete-orphan",
        order_by="ProposalItem.day_number",
    )

    @property
    def created_by_name(self):
        return self.created_by.full_name if self.created_by else None

    @property
    def approved_by_name(self):
        return self.approved_by.full_name if self.approved_by else None

    @property
    def per_person_amount(self):
        total_pax = max(1, self.pax_adults + self.pax_children)
        return round(self.total_client_amount / total_pax, 2)


class ProposalItem(Base):
    __tablename__ = "proposal_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_id = Column(String(36), ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, index=True)
    item_type = Column(Enum(ProposalItemType), default=ProposalItemType.ACTIVITY, nullable=False)
    day_number = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    net_cost = Column(Float, default=0.0, nullable=False)
    selling_price = Column(Float, default=0.0, nullable=False)
    is_optional = Column(Boolean, default=False, nullable=False)

    proposal = relationship("Proposal", back_populates="items")
