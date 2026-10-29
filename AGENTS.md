# AGENTS.md — Jeto Vacations CRM Engineering Guide

Operational guide for AI agents working in `jeto-crm`.

---

## 1. System Architecture & Tech Stack
- **Backend**: FastAPI 0.162+ (Python 3.12), SQLAlchemy 2.x ORM, Alembic migrations, Pydantic v2 schemas.
  - Zero-dependency local dev SQLite (`jeto_crm.db`) & production PostgreSQL (`postgresql://...`).
  - Strict JWT Bearer authentication with Bcrypt password hashing.
  - Test suite: Pytest 9.2+ with in-memory SQLite (`pytest -v`).
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS v4, Lucide icons.
  - Port: `3001` (`http://localhost:3001`).
  - Auth: Client session manager with automated redirect on token expiration.
- **Data Integrity**: Real relational models for Leads, Activities, Tasks, Status History, Users, Teams, and Audit Logs.

---

## 2. Essential Commands
```bash
# Run backend test suite (14 passing tests)
cd services/api && /tmp/jeto-crm-venv/bin/pytest -v

# Run backend seed script
cd services/api && /tmp/jeto-crm-venv/bin/python3 -m app.seed

# Run backend development server (Port 8000)
cd services/api && /tmp/jeto-crm-venv/bin/uvicorn app.main:app --port 8000 --reload

# Build frontend application
cd apps/crm-web && npm run build

# Start frontend development server (Port 3001)
cd apps/crm-web && npm run dev
```

---

## 3. Core Operating Rules
1. **Never Call Legacy Unverified URLs**: Do not configure or fetch unverified endpoints like `jeto-crm-server.onrender.com` or `web-production-6467.up.railway.app`. All CRM operations execute through the local or documented FastAPI backend.
2. **Persistent State Only**: Never introduce ephemeral in-memory state that vanishes on page refresh. Status updates, activity logs, and follow-up tasks must persist directly into the database.
3. **Role & Permission Checks**: All endpoints modifying lead state require valid JWT credentials and enforce user identity.
4. **Symlink Caution (NTFS Mount)**: Builds and virtual environments run in `/tmp` (`/tmp/jeto-crm-venv`, `/tmp/jeto-crm-web-next`) to prevent fuseblk NTFS inode locking.
