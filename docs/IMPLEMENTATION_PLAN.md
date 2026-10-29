# Jeto Vacations CRM — Implementation Plan & Roadmap

**Master Architecture Plan**: Refer to [`RBAC_CRM_MASTER_PLAN.md`](./RBAC_CRM_MASTER_PLAN.md) for full 5-phase enterprise specification.

---

## Phase 1: RBAC Foundation & Granular Security Architecture (Completed)
- [x] Implement `crm/services/api/app/rbac.py` defining fine-grained `Permission` enum, `ROLE_PERMISSIONS` map, and `require_permission()` dependency.
- [x] Record-level query scoping (`scope_leads_query`): Admin sees all, Manager sees team, Consultant sees assigned + unassigned pool, Operations sees won/confirmed.
- [x] Restrict lead reassignment (`/leads/{id}/assign`) to `leads:assign` permission (Admin & Manager only).
- [x] Restrict lead inspection (`/leads/{id}`) so consultants cannot view unassigned/other consultants' private records.
- [x] Restrict user management (`/users`) to `settings:users` (Admin only).
- [x] Add comprehensive automated test suite `crm/services/api/tests/test_rbac.py` (verify 403 Forbidden on unauthorized actions and data scoping).
- [x] Update frontend `AuthContext` with typed `can(permission)` and `isRole(role)` methods.
- [x] Role-scoped frontend UI guards (hiding reassignment, admin settings, and financial margins for unauthorized roles).
- [x] Enhanced login role selector to seamlessly switch between Admin, Manager, Consultant, and Operations.

## Phase 2: Persistent Quotations & CPQ Engine with Role-Gated Margins (Completed)
- [x] Relational database models: `Proposal` and `ProposalItem` with financial calculation triggers.
- [x] Role-gated financial masking: Supplier net cost, markup %, and profit amounts strictly omitted for consultants and clients.
- [x] Margin guardrail: Automatic approval requirement when markup is under 12%, blocking dispatch without Desk Manager approval.
- [x] Tokenized public customer view (`/proposals/public/{client_token}`) with zero PII and digital acceptance (`/accept`) advancing lead to `won`.
- [x] Full CRUD proposals API router (`crm/services/api/app/routers/proposals.py`).
- [x] Automated test suite `tests/test_proposals.py` (4 comprehensive tests, 24/24 passing).
- [x] Frontend Quotations Hub (`/app/quotes`) connected to live API with real-time CPQ calculation, WhatsApp share, and token link copy.

## Phase 3: Customer 360 Repository & Traveler Profiles (Next)
- [ ] Relational `Customer` and `CustomerPreference` models.
- [ ] Automatic lead-to-customer conversion on deal win.
- [ ] Lifetime Value (LTV) and completed holiday history tracking.
- [ ] PII protection and role masking for unassigned team members.

## Phase 3: Bookings, Suppliers & Operations
- [ ] Confirmed Booking entity linked to won leads.
- [ ] Supplier purchase orders (hotels, DMCs, airlines).
- [ ] Payment milestone tracking (advance deposit, balance due dates).
- [ ] Customer voucher generation.

## Phase 4: Integrations & Automation
- [ ] Real WhatsApp Business API webhook integration for two-way chat.
- [ ] Email dispatch via SendGrid / Amazon SES.
- [ ] Direct lead sync between `jet-web` and `jeto-crm`.
