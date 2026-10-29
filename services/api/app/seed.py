import sys
import random
from datetime import datetime, timezone, timedelta
from .database import engine, SessionLocal, Base
from .models.user import User, Team, UserRole
from .models.lead import (
    Lead,
    LeadActivity,
    LeadTask,
    LeadStatusHistory,
    LeadStatus,
    LeadPriority,
    LeadSource,
    ActivityType,
    TaskStatus,
)
from .models.proposal import Proposal, ProposalItem, ProposalStatus, ProposalItemType
from .security import get_password_hash


def seed_database():
    print("Creating tables if not present...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users already exist
        existing_admin = db.query(User).filter(User.email == "admin@jetovacations.com").first()
        if existing_admin:
            print("Database already contains seed data. Skipping seed.")
            return

        print("Seeding teams...")
        team_luxury = Team(name="Outbound Luxury", description="International luxury travel & custom itineraries")
        team_honeymoon = Team(name="Domestic & Honeymoon", description="Honeymoon curation, Kashmir, Kerala & Maldives")
        team_ops = Team(name="Travel Operations", description="Bookings, ticketing, supplier management & on-trip support")
        db.add_all([team_luxury, team_honeymoon, team_ops])
        db.flush()

        print("Seeding users...")
        admin = User(
            email="admin@jetovacations.com",
            hashed_password=get_password_hash("Admin@Jeto2026!"),
            full_name="Aditya Verma (Admin)",
            phone="+919876543210",
            role=UserRole.ADMIN,
            is_active=True,
            team_id=team_luxury.id,
        )
        neha = User(
            email="neha.kapoor@jetovacations.com",
            hashed_password=get_password_hash("Neha@Jeto2026!"),
            full_name="Neha Kapoor (Senior Consultant)",
            phone="+919811122233",
            role=UserRole.CONSULTANT,
            is_active=True,
            team_id=team_luxury.id,
        )
        rahul = User(
            email="rahul.sharma@jetovacations.com",
            hashed_password=get_password_hash("Rahul@Jeto2026!"),
            full_name="Rahul Sharma (Travel Specialist)",
            phone="+919822233344",
            role=UserRole.CONSULTANT,
            is_active=True,
            team_id=team_honeymoon.id,
        )
        pooja = User(
            email="pooja.sharma@jetovacations.com",
            hashed_password=get_password_hash("Pooja@Jeto2026!"),
            full_name="Pooja Sharma (Sales Desk Manager)",
            phone="+919811199988",
            role=UserRole.MANAGER,
            is_active=True,
            team_id=team_luxury.id,
        )
        vikram = User(
            email="vikram.mehta@jetovacations.com",
            hashed_password=get_password_hash("Vikram@Jeto2026!"),
            full_name="Vikram Mehta (Operations Manager)",
            phone="+919833344455",
            role=UserRole.OPERATIONS,
            is_active=True,
            team_id=team_ops.id,
        )
        db.add_all([admin, pooja, neha, rahul, vikram])
        db.flush()

        now = datetime.now(timezone.utc)

        leads_data = [
            {
                "lead_code": "JV-2026-101",
                "customer_name": "Dr. Sameer & Ritu Kulkarni",
                "customer_phone": "+91 98201 54321",
                "customer_email": "sameer.kulkarni@gmail.com",
                "destination": "Switzerland Scenic Alps & Glacier Express",
                "departure_city": "Mumbai (BOM)",
                "travel_month": "June 2026",
                "pax_adults": 2,
                "pax_children": 2,
                "budget": "₹7,50,000 - ₹9,00,000",
                "travel_style": "Ultra Luxury",
                "notes": "Interested in 1st class Swiss Travel Pass, 4-star superior chalet hotels in Zermatt and Lucerne.",
                "source": LeadSource.WEBSITE_ENQUIRY,
                "status": LeadStatus.PROPOSAL_SENT,
                "priority": LeadPriority.HIGH,
                "assigned_to": neha,
                "activities": [
                    ("note", "Initial Discovery Call", "Client prefers private transfers from Zurich and scenic train upgrades. 2 teenage kids."),
                    ("call", "Proposal Walkthrough", "Sent 8N/9D Alpine Explorer proposal via email. Client reviewing hotel options in Interlaken."),
                ],
                "task": ("Review hotel options with client", now + timedelta(days=1)),
            },
            {
                "lead_code": "JV-2026-102",
                "customer_name": "Arjun & Priyanka Singhania",
                "customer_phone": "+91 98199 88776",
                "customer_email": "arjun.singhania@outlook.com",
                "destination": "Maldives Overwater Pool Villa",
                "departure_city": "Delhi (DEL)",
                "travel_month": "May 2026",
                "pax_adults": 2,
                "pax_children": 0,
                "budget": "₹5,00,000 - ₹6,50,000",
                "travel_style": "Honeymoon Special",
                "notes": "All-inclusive meal plan, private seaplane transfer, sunset water villa with pool.",
                "source": LeadSource.CALLBACK_MODAL,
                "status": LeadStatus.WON,
                "priority": LeadPriority.URGENT,
                "assigned_to": rahul,
                "activities": [
                    ("call", "Immediate Callback", "Called within 10 mins of web enquiry. Requested OBLU SELECT Lobigili or Sun Siyam Iru Veli."),
                    ("status_change", "Booking Confirmed", "Client accepted proposal and paid ₹1,50,000 advance. Handed over to operations."),
                ],
                "task": ("Send flight confirmation vouchers", now - timedelta(days=1)),
            },
            {
                "lead_code": "JV-2026-103",
                "customer_name": "Sunil Nair & Family",
                "customer_phone": "+91 97401 22334",
                "customer_email": "sunil.nair@infosys.com",
                "destination": "Bali Luxury Pool Villa & Ubud Cultural Tour",
                "departure_city": "Bengaluru (BLR)",
                "travel_month": "July 2026",
                "pax_adults": 4,
                "pax_children": 1,
                "budget": "₹4,00,000 - ₹5,00,000",
                "travel_style": "Family Luxury",
                "notes": "Family vacation with senior citizens. Require English speaking private chauffeur and purely vegetarian friendly recommendations.",
                "source": LeadSource.WHATSAPP,
                "status": LeadStatus.QUALIFIED,
                "priority": LeadPriority.MEDIUM,
                "assigned_to": neha,
                "activities": [
                    ("whatsapp", "Shared Seminyak Villa catalogue", "Shared PDF with 3 private pool villa options near beach."),
                ],
                "task": ("Draft custom 6N itinerary", now + timedelta(days=2)),
            },
            {
                "lead_code": "JV-2026-104",
                "customer_name": "Kavita Deshmukh",
                "customer_phone": "+91 99200 11223",
                "customer_email": "kavita.deshmukh@tcs.com",
                "destination": "Kashmir Paradise Honeymoon 6N",
                "departure_city": "Pune (PNQ)",
                "travel_month": "April 2026",
                "pax_adults": 2,
                "pax_children": 0,
                "budget": "₹1,80,000 - ₹2,20,000",
                "travel_style": "Boutique Romantic",
                "notes": "Gulmarg gondola Phase 2 tickets guaranteed, luxury houseboat in Dal Lake (Khyber or Kolahoi style).",
                "source": LeadSource.CALLBACK_MODAL,
                "status": LeadStatus.NEW,
                "priority": LeadPriority.URGENT,
                "assigned_to": None,
                "activities": [
                    ("note", "Website Callback Request", "Callback requested between 4:00 PM - 6:00 PM."),
                ],
                "task": None,
            },
            {
                "lead_code": "JV-2026-105",
                "customer_name": "Rohan & Meera Bhatt",
                "customer_phone": "+91 98791 44556",
                "customer_email": "rohan.bhatt@techcorp.in",
                "destination": "Japan Cherry Blossom & High-Speed Bullet Train",
                "departure_city": "Ahmedabad (AMD)",
                "travel_month": "October 2026",
                "pax_adults": 2,
                "pax_children": 0,
                "budget": "₹6,00,000 - ₹8,00,000",
                "travel_style": "Curated Cultural",
                "notes": "Tokyo, Kyoto, Osaka, Hakone onsen stay with Mount Fuji views.",
                "source": LeadSource.WEBSITE_ENQUIRY,
                "status": LeadStatus.CONTACTED,
                "priority": LeadPriority.HIGH,
                "assigned_to": rahul,
                "activities": [
                    ("call", "Discovery Call Completed", "Client confirmed travel window in autumn. Preparing autumn foliage itinerary."),
                ],
                "task": ("Send Japan visa requirement checklist", now + timedelta(days=3)),
            },
            {
                "lead_code": "JV-2026-106",
                "customer_name": "Harish Choudhary",
                "customer_phone": "+91 98480 99887",
                "customer_email": "harish@choudharylogistics.com",
                "destination": "Dubai Ultra Luxury & Desert Glamping",
                "departure_city": "Hyderabad (HYD)",
                "travel_month": "November 2026",
                "pax_adults": 6,
                "pax_children": 2,
                "budget": "₹8,00,000+",
                "travel_style": "VIP Group",
                "notes": "Atlantis The Royal stay + Bab Al Shams desert resort. Private yacht cruise in Dubai Marina.",
                "source": LeadSource.DIRECT_CALL,
                "status": LeadStatus.NEGOTIATING,
                "priority": LeadPriority.HIGH,
                "assigned_to": neha,
                "activities": [
                    ("call", "Revised Itinerary Discussion", "Client requested helicopter transfer from Dubai airport to Atlantis."),
                ],
                "task": ("Confirm Atlantis The Royal suite rates", now + timedelta(hours=4)),
            },
            {
                "lead_code": "JV-2026-107",
                "customer_name": "Tarun & Ananya Sen",
                "customer_phone": "+91 98310 77665",
                "customer_email": "tarun.sen@kolkatatech.com",
                "destination": "Vietnam & Cambodia 9N Grand Tour",
                "departure_city": "Kolkata (CCU)",
                "travel_month": "December 2026",
                "pax_adults": 2,
                "pax_children": 1,
                "budget": "₹3,50,000 - ₹4,20,000",
                "travel_style": "Heritage & Nature",
                "notes": "Ha Long Bay luxury overnight cruise (Paradise Elegance) and Angkor Wat sunrise tour.",
                "source": LeadSource.WEBSITE_ENQUIRY,
                "status": LeadStatus.ASSIGNED,
                "priority": LeadPriority.MEDIUM,
                "assigned_to": rahul,
                "activities": [
                    ("note", "Assigned to Rahul Sharma", "Assigned based on Indochina expertise."),
                ],
                "task": ("First introductory call with Tarun", now + timedelta(hours=2)),
            },
            {
                "lead_code": "JV-2026-108",
                "customer_name": "Alok Gupta",
                "customer_phone": "+91 98100 33445",
                "customer_email": "alok.gupta@delhirealty.com",
                "destination": "Andaman Island Havelock & Neil Island",
                "departure_city": "Delhi (DEL)",
                "travel_month": "March 2026",
                "pax_adults": 2,
                "pax_children": 2,
                "budget": "₹2,00,000",
                "travel_style": "Beach Leisure",
                "notes": "Client was looking for budget package below ₹1,00,000 total which is not feasible for 5-star Havelock properties.",
                "source": LeadSource.CALLBACK_MODAL,
                "status": LeadStatus.LOST,
                "priority": LeadPriority.LOW,
                "assigned_to": rahul,
                "activities": [
                    ("status_change", "Closed as Lost", "Budget expectation mismatched with high season flight & resort rates."),
                ],
                "task": None,
            },
        ]

        print("Seeding leads, activities, and tasks...")
        for ld in leads_data:
            lead = Lead(
                lead_code=ld["lead_code"],
                customer_name=ld["customer_name"],
                customer_phone=ld["customer_phone"],
                customer_email=ld["customer_email"],
                destination=ld["destination"],
                departure_city=ld["departure_city"],
                travel_month=ld["travel_month"],
                pax_adults=ld["pax_adults"],
                pax_children=ld["pax_children"],
                budget=ld["budget"],
                travel_style=ld["travel_style"],
                notes=ld["notes"],
                source=ld["source"],
                status=ld["status"],
                priority=ld["priority"],
                assigned_to_id=ld["assigned_to"].id if ld["assigned_to"] else None,
            )
            db.add(lead)
            db.flush()

            for act_type, subj, cont in ld["activities"]:
                atype = ActivityType.NOTE
                if act_type == "call":
                    atype = ActivityType.CALL
                elif act_type == "whatsapp":
                    atype = ActivityType.WHATSAPP
                elif act_type == "status_change":
                    atype = ActivityType.STATUS_CHANGE
                elif act_type == "assignment":
                    atype = ActivityType.ASSIGNMENT

                author = ld["assigned_to"] if ld["assigned_to"] else admin
                activity = LeadActivity(
                    lead_id=lead.id,
                    author_id=author.id,
                    activity_type=atype,
                    subject=subj,
                    content=cont,
                    created_at=now - timedelta(hours=random.randint(1, 48)),
                )
                db.add(activity)

            if ld["task"]:
                title, due = ld["task"]
                task = LeadTask(
                    lead_id=lead.id,
                    assigned_to_id=ld["assigned_to"].id if ld["assigned_to"] else admin.id,
                    title=title,
                    due_date=due,
                    status=TaskStatus.COMPLETED if due < now else TaskStatus.PENDING,
                    completed_at=now if due < now else None,
                )
                db.add(task)
                if due > now:
                    lead.next_follow_up_at = due

        # Seed Sample Proposals & Quotations
        print("Seeding proposals...")
        first_lead = db.query(Lead).filter(Lead.lead_code == "JV-2026-101").first()
        prop1 = Proposal(
            proposal_code="JET-2026-101",
            lead_id=first_lead.id if first_lead else None,
            created_by_id=neha.id,
            title="Switzerland 9-Night Scenic Alps & Glacier Express",
            destination="Switzerland",
            nights=9,
            pax_adults=2,
            pax_children=2,
            status=ProposalStatus.SENT,
            valid_until=now + timedelta(days=12),
            supplier_cost=650000.0,
            markup_percentage=18.0,
            profit_amount=117000.0,
            tax_percentage=5.0,
            tax_amount=38350.0,
            total_client_amount=805350.0,
            currency="INR",
            requires_approval=False,
            notes="1st Class Swiss Travel Pass for family with private Zurich & Geneva transfers.",
        )
        db.add(prop1)
        db.flush()

        item1 = ProposalItem(
            proposal_id=prop1.id,
            item_type=ProposalItemType.HOTEL,
            day_number=1,
            title="Victoria-Jungfrau Grand Hotel & Spa Interlaken",
            description="2x Deluxe Family Rooms with Jungfrau view and gourmet breakfast",
            net_cost=280000.0,
            selling_price=340000.0,
        )
        item2 = ProposalItem(
            proposal_id=prop1.id,
            item_type=ProposalItemType.ACTIVITY,
            day_number=4,
            title="Glacier Express Excellence Class & Zermatt Peak Tour",
            description="Panoramic glass roof carriage with 5-course degustation menu",
            net_cost=120000.0,
            selling_price=150000.0,
        )
        db.add_all([item1, item2])

        db.commit()
        print("✅ Database successfully seeded with Jeto CRM initial data!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seed: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
