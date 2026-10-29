# Jeto Vacations CRM — Current System State

**Updated**: October 30, 2026

---

## 1. System Health & Verification Status
- **Backend**:
  - FastAPI 0.162 running on port `8000`.
  - Database: `jeto_crm.db` (SQLite for local zero-dependency development, Alembic revision `679f4df76ce8`).
  - Automated Tests: 24 / 24 passing (`pytest -v`), covering auth, leads, RBAC scoping, and the new Proposal CPQ engine.
  - Auth & RBAC: JWT Bearer with Bcrypt password hashing & granular permission-level authorization (`Permission` enum).
  - Data Scoping & Financial Protection: Record-level isolation across global (Admin), team (Manager), and personal assigned + inbound pool (Consultant); supplier costs and profit margins strictly role-gated.
  - Proposals & CPQ: Persistent `Proposal` and `ProposalItem` relational models with automatic price calculation, margin approval guardrails, and tokenized zero-PII public customer links (`/proposals/public/{client_token}`).
- **Frontend**:
  - Next.js 16.4.2 running on port `3001` (`http://localhost:3001`).
  - Turbopack production build verified: 10 / 10 routes compiled without errors:
    - `/` (Redirect to app/login)
    - `/login` (Demo credentials & JWT authentication)
    - `/app` (Executive Sales & Ops Cockpit)
    - `/app/leads` (Dual-view: Interactive Kanban Pipeline Board ⇋ Full Data Table)
    - `/app/leads/[id]` (3-Column Lead Workstation with WhatsApp click-to-chat, requirements, timeline, quotes, tasks)
    - `/app/quotes` (Quotation CPQ Engine with live margin % & GST calculation)
    - `/app/knowledge` (Destination Knowledge Wiki covering 19 reference routes)
    - `/app/customers` (Customer 360 directory with LTV and trip histories)
    - `/app/tasks` (Team agenda with overdue and priority filters)
    - `/_not-found`
- **Data & Discovery Integration**:
  - Integrated discovery pack specifications from `crm/docs/reference/Jeto_CRM_Rebuild_Discovery_Pack`.
  - Global `⌘K` Command Palette for instant navigation across destinations, leads, quotes, and customers.
  - Desk Team switcher ("Outbound Luxury Desk", "Domestic & Honeymoon", "VIP Corporate").

---

## 2. Active Services Ports
- **FastAPI CRM API**: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- **Next.js CRM Web**: `http://localhost:3001`
- **Next.js Public Site (`jet-web`)**: `http://localhost:3000`

---

## 3. Verified End-to-End User Journey
1. Open `http://localhost:3001/login`.
2. Click "One-Click Demo Roles" → "Senior Consultant: Neha Kapoor".
3. Sign in successfully; redirected to `/app`.
4. Dashboard displays live KPI counts (8 leads, 5 active in pipeline, 1 won, 1 lost).
5. Click "Open Leads Inbox"; table displays all leads with status badges, customer phone numbers, destinations, and assignees.
6. Click "New Lead", fill out travel requirement for Switzerland/Bali, click submit; new lead opens immediately in detail view.
7. Change status dropdown from `NEW` to `CONTACTED`; status change modal prompts for context.
8. Add a Call Log with discussion notes; appends to the chronological timeline.
9. Schedule a follow-up task; due date is tracked and checkmark toggles completion.
10. Refresh page; all changes persist directly in the database.
