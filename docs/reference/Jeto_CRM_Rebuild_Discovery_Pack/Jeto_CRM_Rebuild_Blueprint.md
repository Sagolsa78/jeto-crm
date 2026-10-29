# Jeto CRM Rebuild — Source Discovery and Phased Blueprint

Prepared from the three supplied text files. This is a source-based discovery report, not a full repository or live-system audit. Do not treat any legacy secret, token, or URL as trusted.

## 1. Source coverage

- **Pasted text(20261020-100048).txt** — Compiled React/webpack frontend bundle; page routes, components, Firebase config, auth and Vercel Speed Insights initialization.
- **Pasted text (2)(20261020-100546).txt** — API service wrapper; backend endpoints and legacy provider/service integrations.
- **Pasted text(20261020-100537).txt** — Vercel Speed Insights web-vitals telemetry implementation.

### Extracted inventory

- Frontend route path strings: **91**
- Active API-call occurrences found in exported functions: **439**
- Unique literal HTTP-method/path pairs: **436**
- These counts exclude any dynamic URL paths that could not be represented as a literal and do not tell us if the server implements every route.

## 2. Legacy server references

- `https://jeto-crm-server.onrender.com`
- `https://web-production-6467.up.railway.app`
- `https://jetovacations.in (commented legacy reference)`
- `https://jetocrm-server.azurewebsites.net (commented legacy reference)`
- `https://jetocrm-project.herokuapp.com (commented legacy reference)`

**Use recommendation:** put a single `LEGACY_API_BASE_URL` behind an environment variable in a migration adapter. Verify health, ownership, certificates, data residency, authentication, and backend contract before calling it. I could not verify either legacy health endpoint from this environment because the network/DNS checks were unavailable; that is not evidence that either server is down. Do not let production automatically fail over between databases or backend environments unless consistency and write behavior are explicitly designed.

## 3. Security findings to address before reuse

- **Hardcoded third-party credentials:** source contains a token-like value associated with a telephony provider, an exchange-rate API key, and travel-provider integration credentials embedded in client-visible code. Validity/permissions have not been confirmed; rotate/revoke genuine credentials and review provider logs. Secret values are deliberately not reproduced in this report.
- **Token storage and transport:** the compiled frontend references query-token handling and `localStorage` storage for an authentication token. Prefer secure server-managed sessions or a carefully designed token flow; avoid tokens in URLs, clear sessions on logout, rotate refresh sessions, and verify permissions server-side for every object and action.
- **Firebase config:** a web Firebase configuration is present in the bundle. That is not automatically a secret, but Firebase rules, authorized domains and API restrictions must be validated.
- **Telemetry privacy:** the Vercel Speed Insights bundle sends performance metrics with page URL/route information and element attribution. Redact query strings and never put tokens/customer PII in URLs.
- **No backend proof:** these are source-level exposure and design findings. The provided files do not establish whether any credential remains active or whether backend authorization is weak.

## 4. Frontend module map

### Customers (4 routes)
- `/custdataentry`
- `/custdataentry/:id`
- `/listcustdata`
- `/searchcust`

### Dashboard & analytics (6 routes)
- `/analyticsadmin`
- `/analyticsdata`
- `/dashboard`
- `/home`
- `/productanalytics`
- `/tlhome`

### Flights & bookings (4 routes)
- `/flightapi`
- `/flightbook`
- `/flightview`
- `/viewvoucher`

### General / system (5 routes)
- `*`
- `/`
- `/engine.io`
- `/productbased`
- `/test`

### Inventory & suppliers (19 routes)
- `/duptourentry/:id`
- `/fddataentry`
- `/fddataentry/:id`
- `/hotelapi`
- `/hotelbook`
- `/hoteldataentry`
- `/hoteldataentry/:id`
- `/hotelview`
- `/hotelvoucher`
- `/listfddata`
- `/listhoteldata`
- `/listsupplierdata`
- `/listtourdata`
- `/searchhotel`
- `/supplierdataentry`
- `/supplierdataentry/:id`
- `/supplierdatarecord/:id`
- `/tourdataentry`
- `/tourdataentry/:id`

### Knowledge & resources (19 routes)
- `/info`
- `/knowledge/SriLanka`
- `/knowledge/andaman`
- `/knowledge/azerbaijan`
- `/knowledge/dubai`
- `/knowledge/goa`
- `/knowledge/himachal`
- `/knowledge/indonesia`
- `/knowledge/kashmir`
- `/knowledge/kazakhstan`
- `/knowledge/kerala`
- `/knowledge/ladakh`
- `/knowledge/malaysia`
- `/knowledge/sikkim-darjeeling`
- `/knowledge/singapore`
- `/knowledge/thailand`
- `/knowledge/turkey`
- `/knowledge/vietnam`
- `/knowledgecenter`

### Leads (5 routes)
- `/lead`
- `/lead/:id`
- `/leadcaptureform`
- `/leadrules`
- `/leadtripdataentry`

### Marketing & communications (3 routes)
- `/bulkmsg`
- `/chat`
- `/marketing`

### Quotations (5 routes)
- `/listquotedata`
- `/quotedataentry`
- `/quotedataentry/:id`
- `/reusequote`
- `/viewquote/:id`

### Trips & post-sales (10 routes)
- `/duptripentry`
- `/listtripsdata`
- `/postsalesdata`
- `/salessupport`
- `/searchtrip`
- `/tripdataentry`
- `/tripdataentry/:id`
- `/tripdataentry/:id/invoice`
- `/tripdataentry/:id/payments`
- `/tripdataentry/:id/paymentupdate`

### Workforce & operations (11 routes)
- `/canddataentry`
- `/canddataentry/:id`
- `/employeedataentry`
- `/employeedataentry/:id`
- `/listassetdata`
- `/listemployeedata`
- `/listhrdata`
- `/listtaskdata`
- `/projects`
- `/taskdataentry`
- `/taskdataentry/:id`

## 5. API route inventory summary

- **Trips & sales pipeline: 98 unique endpoint pairs**
- **Analytics & reporting: 48 unique endpoint pairs**
- **Hotels, tours & suppliers: 37 unique endpoint pairs**
- **Leads & lead acquisition: 34 unique endpoint pairs**
- **AI & automation: 30 unique endpoint pairs**
- **Flights & air bookings: 28 unique endpoint pairs**
- **General / unclassified: 23 unique endpoint pairs**
- **Customers & contacts: 22 unique endpoint pairs**
- **Marketing, messaging & telephony: 22 unique endpoint pairs**
- **Tasks & projects: 20 unique endpoint pairs**
- **Quotations & proposals: 19 unique endpoint pairs**
- **HR, attendance & assets: 17 unique endpoint pairs**
- **Authentication & session: 15 unique endpoint pairs**
- **Finance, payments & currency: 12 unique endpoint pairs**
- **Visa, documents & files: 9 unique endpoint pairs**
- **Configuration & integrations: 2 unique endpoint pairs**

## 6. Rebuild modules (recommended target scope)

1. **Platform foundation:** organizations/tenants, users, teams, roles, permissions, SSO/MFA-ready authentication, sessions, audit log, feature flags, settings, notifications, file storage, import/export, and a configurable custom-field system.
2. **Lead management:** omnichannel ingestion, deduplication, enrichment, assignment rules, SLA timers, lead scoring, pipeline stages, activity timeline, follow-up tasks, loss reasons, merge/convert workflows, consent/preferences.
3. **Customer/contacts:** customer profile, travellers/passengers, communication history, preferences, trip history, duplicate merge, loyalty data, privacy/consent tracking, service timeline.
4. **Trips/deals/pipeline:** enquiry → qualification → requirements → proposal → quote → confirmation → pre-travel → in-trip → completed/cancelled; owner/team, status history, tasks, probability, margin, postponements, referrals, cancellation and refund workflows.
5. **Quotations/itineraries:** versioned quote, day-wise itinerary, pricing components, currency/markup/discount/tax policies, PDF/email/WhatsApp delivery, quote approval, conversion to booking, version snapshots.
6. **Travel inventory:** destinations, hotel properties/rooms/rates, tour/activity catalog, transfers, supplier contracts and availability, tags, stop-sell/blackout dates, cost/markup, supplier performance.
7. **Bookings & operations:** travel booking record, traveller documents, flight/hotel/activity reservations, PNR/ticket lifecycle, vouchers, supplier confirmation, checklists, operations handover, departure calendar, incident handling.
8. **Visa and document management:** per-traveller checklist, expiry alerts, secure uploads, document access controls, AI extraction with human review, retention/deletion policies.
9. **Finance & reconciliation:** customer receivables, supplier payables, deposits, instalments, refund approvals, commissions/incentives, tax invoice and credit note support, multi-currency snapshots, profit/margin and reconciliation audit trail. Have a qualified accountant validate India GST rules before production.
10. **Communication centre:** email, SMS/WhatsApp, telephony, call logs/recordings, chat inbox, templates, opt-out and consent, campaign audience rules, rate limits and provider event webhooks.
11. **Tasks/workforce:** tasks, recurring follow-ups, assignment/escalation, attendance/sign-in, leave/HR records (only if required), employee onboarding/offboarding, projects, assets, role-based reports.
12. **Analytics & reporting:** role-filtered dashboards, lead funnel, response SLAs, conversion, bookings/revenue, cancellation/refund, margin, supplier performance, team scorecards, scheduled reports, saved filters and export permissions.
13. **AI & automation:** call transcription/summarization, quote/itinerary assistant, extraction, customer intent/lead scoring, next-best-action suggestions, natural-language reporting with safe query plans, automation builder, approval gates and complete AI usage logs.
14. **Administration & governance:** code lists, statuses, currencies/FX policy, lead rules, supplier/integration credentials, API keys, job status, audit log viewer, data retention, backups, import validation, API documentation and feature flags.

## 7. Reference benchmark (not a copy of a competitor)

- **Salesforce Sales Cloud:** standard sales object model around Leads, Accounts, Contacts, Opportunities, Activities and forecasting; adapt the pipeline and forecast pattern for travel deals. Source: https://www.salesforce.com/in/sales/cloud/guide/
- **HubSpot CRM:** associated objects, record timelines/activities, payments/conversations, and configurable custom objects; borrow association navigation and a unified customer timeline. Source: https://knowledge.hubspot.com/records/understand-objects
- **Zoho CRM:** Leads, Accounts, Contacts, Deals, Forecasts, Activities plus Campaigns, Products, Price Books and CPQ; use as a checklist for module completeness and clean lead conversion. Sources: https://www.zoho.com/crm/developer/docs/api/v8/modules-api.html and https://help.zoho.com/portal/en/kb/crm/crm-reference/introduction-to-zoho-crm/articles/understand-crm-account
- **Odoo CRM:** pipeline activities, lead capture and conversion, team routing, scoring, quotations and win/loss analytics; use as a checklist for day-to-day sales activity and pipeline visibility. Source: https://www.odoo.com/documentation/16.0/applications/sales/crm.html
- **Travel-specialist feature references:** trip itinerary builder, quotation, bookings, vouchers, visa/document tracking, supplier payments, GST-ready invoicing and agency/team access. These vendor feature pages are product marketing, so use them as discovery checklists rather than as proof that a feature works well. Sources: https://www.travkonnect.com/in/features/ and https://www.createmycrm.com/crm/travel

## 8. Recommended technology and architecture

- **Frontend:** Next.js App Router + React + TypeScript; accessible design system, route-level layouts, server components where appropriate, client components for rich interactive CRM tables/forms. Use TanStack Query for client-server cache and mutation lifecycle; use a form/schema library and generated API types from OpenAPI.
- **Backend:** FastAPI + Pydantic v2 + SQLAlchemy 2.x/Alembic; modular monolith with explicit domain modules and OpenAPI contracts. Avoid microservices until load, team boundaries, or reliability needs justify them.
- **Database:** PostgreSQL as source of truth; normalized transactional model, proper FK/unique constraints, append-only audit events where required, indexes based on real query plans, migrations in CI. Consider PostgreSQL row-level security as defence-in-depth, not a substitute for application authorization.
- **Cache/queue:** Redis for cache, throttling and short-lived state. Use a durable job queue/worker for emails, AI, document processing, report generation, webhooks and booking sync; every job must be idempotent and retryable with dead-letter handling.
- **Files:** S3-compatible object storage, private by default, signed short-lived downloads, virus/file-type checks, metadata in PostgreSQL, retention/deletion policy. No provider secret belongs in the browser.
- **Integrations:** backend adapters for flight inventory, hotel providers, WhatsApp, email, telephony, FX and AI. Separate provider DTOs from core business entities; secrets in managed secret storage; webhooks signed and idempotent.
- **Observability:** structured logs, request IDs, traces, metrics, error reporting, provider and job dashboards, health/readiness endpoints. OpenTelemetry documents traces, metrics, logs and baggage as signal types: https://opentelemetry.io/docs/concepts/signals/
- **Authentication:** managed identity/OIDC or robust server-side auth, short-lived access tokens and rotated refresh sessions, secure HttpOnly/Secure/SameSite cookies where suitable, MFA for privileged roles, server-side permission checks. FastAPI documents OAuth2/JWT and password hashing patterns: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/

## 9. Phased execution sequence

### Phase 0 — Evidence and safety baseline
- Obtain actual frontend and backend repositories, deployment config, migrations/schema, environment variable names (never values), current API contracts, and a sanitised sample database.
- Rotate exposed secrets; inventory all public routes; establish staging environments; take verified backups and prove restore.
- Test old backend URLs safely and identify which data store each points to. Never use automatic write failover between independent databases.

### Phase 1 — Domain and contract design
- Define canonical entities and state machines. Map each old page and exported API function to a new module/endpoint; label each as preserve, merge, replace, retire, or unclear.
- Publish OpenAPI specs and sample payloads; settle pagination, sorting/filter syntax, error envelope, idempotency keys, audit/event schema and API versioning.

### Phase 2 — Secure platform foundation
- Build login/session management, tenants, users, teams, RBAC/permission policies, audit history, files, notifications, settings, migrations, CI, test data and observability.
- Add unit/integration/API contract tests and security tests before exposing business endpoints.

### Phase 3 — Sales MVP
- Implement leads, customers, assignment, activity timeline, tasks/follow-ups, trip/deal pipeline and a conversion workflow. Migrate a small anonymised sample and compare totals.

### Phase 4 — Travel sales and operations
- Add quotation/itinerary versioning, supplier and inventory management, bookings, operational checklists, traveller/visa documents, vouchers and cancellation/refund flows.

### Phase 5 — Money and communications
- Add invoices, receipts, instalments, payables, FX snapshots, commissions, email/WhatsApp/telephony adapters and consent-led automation. Run reconciliation tests against historical data.

### Phase 6 — Analytics and AI
- Rebuild the KPI dashboards from documented definitions; add scheduled reports and AI workflows only with permissions, bounded inputs, human approval for consequential actions, and cost/rate controls.

### Phase 7 — Shadow migration and cutover
- Dual-read/shadow compare; backfill; validate row counts, relationships, financial aggregates and files; freeze legacy writes for final delta; rehearse rollback; cut traffic gradually; retain read-only access until reconciled.

### Phase 8 — Optimisation
- Load tests, query tuning, caching, queue capacity, incident runbooks, backup restore drills, accessibility/mobile QA and feature rollout metrics.

## 10. Non-negotiable acceptance gates

- Every endpoint is documented, permission-checked and tested; no route is considered done just because the UI calls it.
- Cross-user/cross-team access tests cover every sensitive resource ID and every privileged operation.
- No production credential is committed to source or sent to the browser. CI scans secrets and dependencies.
- Mutations use semantically correct methods; critical business actions are transactional and idempotent.
- Every important state transition has actor, timestamp, reason and before/after audit context.
- Migration reconciles leads/customers/trips/quotes/bookings/payments/files; backups are restorable; rollback plan is tested.

## 11. Evidence and limits

- The bundle reveals compiled page routes, but obfuscated component symbols do not reliably identify original source filenames.
- The API module reveals client calls, including the code paths intended for integrations, but not server-side validation or data access controls.
- The Vercel file is a performance telemetry bundle; it measures web vitals and emits metrics/route/URL information. Sanitize sensitive URL/query data.
- No backend source files, live route registry, database schema, complete environment configuration, or deployment health evidence were included. Do not claim the 436 endpoint pairs are all implemented server-side.

## Appendix A — API endpoint inventory

See the paired CSV `jeto_crm_api_inventory.csv` for method, literal path, likely module category, and exported function names.

## Appendix B — Frontend route inventory

See the paired CSV `jeto_crm_frontend_route_inventory.csv` for route path strings and coarse module categories.
