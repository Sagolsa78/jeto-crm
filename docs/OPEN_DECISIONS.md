# Jeto Vacations CRM — Open Architectural Decisions

## Decision Log

### 1. Separate Repository / Directory Architecture (ADR-001)
- **Status**: Decided & Implemented.
- **Context**: The existing `jet-web` repository houses the public-facing holiday website. The CRM requires internal business logic, staff authentication, CRM APIs, and operational data.
- **Decision**: Built `jeto-crm` in a separate modular directory alongside `jet-web`.
- **Outcome**: Clean separation of concerns. Public SEO and client site are decoupled from internal operations, while communicating over documented APIs (`/public/weblead` and `/proposal/[id]`).

### 2. Python FastAPI Backend + Next.js Frontend (ADR-002)
- **Status**: Decided & Implemented.
- **Context**: Travel CRM requires fast async operations, tight relational data consistency (SQLAlchemy), and rich data table UI.
- **Decision**: FastAPI for API server + Next.js App Router for frontend UI.
- **Outcome**: Excellent developer experience, auto-generating interactive Swagger API docs (`/docs`), strong typing with Pydantic v2, and high frontend speed.

### 3. Database Strategy: SQLite Dev + PostgreSQL Prod (ADR-003)
- **Status**: Decided & Implemented.
- **Context**: Rapid local testing without running heavyweight database servers vs production reliability.
- **Decision**: SQLAlchemy with dynamic engine config: SQLite for zero-dependency local dev/tests, PostgreSQL via `DATABASE_URL` in Docker/production.
- **Outcome**: Tests run in under 3 seconds in memory; production uses PostgreSQL ACID transactions.

### 4. Legacy CRM Backend Migration (ADR-004)
- **Status**: Decided & Implemented.
- **Context**: Old frontend referenced unverified Render/Railway URLs with undocumented endpoints.
- **Decision**: Treat legacy artifacts solely as discovery inputs; build clean, modern, documented contracts from scratch.
- **Outcome**: Zero reliance on dead external servers or unverified contracts.
