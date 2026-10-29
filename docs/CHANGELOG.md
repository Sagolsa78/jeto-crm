# Jeto Vacations CRM — Changelog

## [1.0.0] - 2026-10-29

### Added
- **Architectural Layout**: Created dedicated `jeto-crm` directory alongside `jet-web` with `services/api`, `apps/crm-web`, `infra`, and `docs`.
- **Relational Backend**:
  - FastAPI application in `services/api/app/main.py`.
  - SQLAlchemy models for `User`, `Team`, `Lead`, `LeadActivity`, `LeadTask`, `LeadStatusHistory`, `AuditLog`.
  - Pydantic v2 schemas with `ConfigDict(from_attributes=True)`.
  - Alembic database migration system configured with initial schema revision `679f4df76ce8`.
  - Bcrypt password hashing & JWT bearer token authentication.
  - Endpoints for auth (`/login`, `/me`), users (`/users`), leads (`/leads`, status update, assign, activities, tasks), dashboard analytics (`/dashboard/metrics`), and public lead ingestion (`/public/weblead`).
  - Synthetic data seed script (`app/seed.py`) generating realistic Indian travel inquiries, consultants, activities, and follow-ups.
  - 14 automated unit and integration tests passing in Pytest.
- **Frontend CRM Portal**:
  - Next.js 16 App Router application in `apps/crm-web` with Tailwind CSS v4 and Lucide icons.
  - Client authentication context with token persistence and session restoration.
  - Branded executive login screen (`/login`) with one-click synthetic demo credentials.
  - App shell layout (`/app/layout.tsx`) with dark sidebar, navigation, role badge, and sign-out.
  - Real-time sales and operations dashboard (`/app`) with KPI cards, stage distribution, and acquisition breakdown.
  - Leads Inbox (`/app/leads`) with search, multi-stage filter tabs, priority filter, consultant filter, and "New Lead" creation modal.
  - Lead Detail view (`/app/leads/[id]`) with client requirements, stage transition dropdown with context prompt, consultant assignment selector, interaction logger (call logs, notes, WhatsApp), follow-up task scheduler with completion checkboxes, and chronological timeline.
- **Infrastructure & Documentation**:
  - `infra/docker-compose.yml` for multi-container deployment (PostgreSQL, FastAPI, Next.js).
  - Complete documentation suite across 9 markdown specifications in `docs/`.
