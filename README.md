# Jeto Vacations — Advanced Travel CRM

A purpose-built, high-performance customer relationship management and holiday operations system designed for **Jeto Vacations**, an outbound and luxury travel business.

---

## 🌟 Capabilities & Features

### 1. Lead Pipeline Management
- **Intake**: Multi-channel lead capture from website enquiries, callback modals, direct calls, WhatsApp, and meta ads.
- **Workflow Stages**: New → Assigned → Contacted → Qualified → Proposal Sent → Negotiating → Won (Booked) → Lost.
- **Consultant Assignment**: Instant assignment to travel consultants with notifications and ownership tracking.
- **Status Audit Trail**: Enforced reason requirements when transitioning leads, with automated activity recording.

### 2. Interaction Timeline & Follow-up Tasks
- **Call & Note Logging**: Consultants can log client discussions, itinerary requests, and custom hotel choices.
- **Follow-up Tasks**: Scheduled reminders with due dates, overdue badges, and one-click completion.
- **Timeline Feed**: Chronological log of all consultant interactions, status transitions, and assignments.

### 3. Executive Dashboard
- Real-time KPI cards: Total volume, action-needed new enquiries, active in-flight pipeline, conversion rate, and overdue tasks.
- Visual stage breakdown and acquisition channel distribution.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| **Auth** | JWT Bearer Tokens, Bcrypt Password Hashing, RBAC |
| **Database** | PostgreSQL (Docker/Production) & SQLite (Local zero-config) |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Icons & UI** | Lucide Icons, Mobile Responsive Slate/Teal Operations Theme |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.12+
- Node.js 20+

### 2. Start Backend API (Port 8000)
```bash
cd services/api

# Create & activate venv
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run seed script (generates demo consultants & leads)
python -m app.seed

# Start FastAPI server
uvicorn app.main:app --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 3. Start Frontend Portal (Port 3001)
```bash
cd apps/crm-web
npm install
npm run dev
```
Access the CRM portal at: `http://localhost:3001`

---

## 🔑 Demo Accounts (Synthetic Data)

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@jetovacations.com` | `Admin@Jeto2026!` | Full System & Team Management |
| **Senior Consultant** | `neha.kapoor@jetovacations.com` | `Neha@Jeto2026!` | Luxury Outbound Leads & Quotes |
| **Travel Specialist** | `rahul.sharma@jetovacations.com` | `Rahul@Jeto2026!` | Honeymoon & Domestic Pipeline |

---

## 🧪 Testing

```bash
cd services/api
pytest -v
```
**Results**: 14 tests passing (100% pass rate).
