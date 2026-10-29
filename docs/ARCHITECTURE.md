# Jeto Vacations CRM — Architecture Overview

## 1. System Topology

```
+-----------------------------------------------------------------+
| Jeto Vacations Public Website (jet-web Next.js on port 3000)     |
| [RequestQuoteModal] / [CallbackModal]                            |
+-------------------------------+---------------------------------+
                                |
                   POST /api/v1/public/weblead
                                |
                                v
+-----------------------------------------------------------------+
| Jeto CRM FastAPI Backend (services/api on port 8000)             |
| - JWT Bearer Auth & Role Authorization                          |
| - REST API Endpoints (/auth, /users, /leads, /dashboard)        |
| - SQLAlchemy 2.0 ORM + Pydantic v2 Schema Validation            |
+-------------------------------+---------------------------------+
                                |
              +-----------------+-----------------+
              |                                   |
              v                                   v
+-----------------------------+     +-----------------------------+
| PostgreSQL / SQLite Database|     | CRM Web App (apps/crm-web)  |
| - leads, users, teams       |     | Next.js 16 + Tailwind CSS   |
| - lead_activities, tasks    |     | Live Port 3001              |
+-----------------------------+     +-----------------------------+
```

## 2. Component Design

### Backend (`services/api`)
- **FastAPI**: Asynchronous, typed Python web framework with auto-generated OpenAPI documentation (`/docs`).
- **SQLAlchemy 2.x & Alembic**: Relational data modeling with migrations and database portability (SQLite local dev, PostgreSQL production).
- **Security**: Password hashing using `bcrypt`, JWT access tokens signed with HMAC-SHA256 (`HS256`).

### Frontend (`apps/crm-web`)
- **Next.js 16 App Router**: React 19 server and client components, optimized Turbopack build.
- **Client Session Management**: Context-based auth provider storing JWT credentials in localStorage with auto-logout on 401s.
- **Tailwind CSS v4**: Modular styling system tailored for data density, readability, and mobile responsiveness.

## 3. Data Flow
1. **Inbound Web Lead**: Public form submits payload to `/public/weblead` without credentials. Lead is created in `new` state.
2. **Consultant Sign-in**: Consultant enters credentials at `/login`, receives JWT token, redirected to dashboard.
3. **Lead Processing**: Consultant opens lead detail, logs discovery call, updates status to `contacted`, schedules follow-up task.
4. **State Persistence**: Every update writes directly to the relational database and creates an audit record.
