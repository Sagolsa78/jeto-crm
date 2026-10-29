# Jeto Vacations CRM — Enterprise RBAC & Architecture Master Plan

**Status**: Active — Phase 1 in progress  
**Last Updated**: October 30, 2026

---

## 1. Executive Summary & Vision

This plan upgrades the Jeto Vacations CRM from a single-tier lead tracking tool into an **Enterprise Travel Operations & Sales Platform** modeled after industry standards (Salesforce Travel & Hospitality Cloud, HubSpot Enterprise, Dolphin Dynamics, Tourplan).

It introduces:
1. **Granular Role-Based Access Control (RBAC)** with permission-level enforcement.
2. **Record-Level Data Scoping** (Global, Team, and Assigned-only views).
3. **Enterprise CPQ & Quotation Engine** with margin privacy controls.
4. **Customer 360 Directory** with persistent traveler preferences and lifetime value tracking.
5. **Intelligent Lead Routing & SLA Escalation**.

---

## 2. Role & Permission Architecture

### A. Personas & Responsibilities

1. **Admin / Executive (Aditya Verma)**:
   - Full visibility across all desks, consultants, and financials.
   - User account lifecycle management, role definitions, and team configurations.
   - Deletion authority and high-level conversion analytics.

2. **Sales Desk Manager (Pooja Sharma)**:
   - Manages team lead allocation, quota tracking, and response times.
   - Authority to assign/reassign leads across team consultants.
   - Quotation discount and margin approval.

3. **Travel Consultant (Neha Kapoor)**:
   - Focused personal workstation: assigned leads + new unassigned inbound pool.
   - Client interaction logging (calls, WhatsApp, notes).
   - Task scheduling, quotation creation within margin guardrails.
   - Cannot view other consultants' private leads or raw agency margin %.

4. **Operations Specialist (Karan Malhotra)**:
   - Manages post-booking fulfillment for won deals.
   - Generates vouchers, coordinates flight PNRs, hotel confirmations, and travel documentation.

---

### B. Permissions Matrix

| Permission Key | Description | Admin | Manager | Consultant | Operations |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `leads:view_all` | View leads across all desks and consultants | ✅ | ❌ | ❌ | ❌ |
| `leads:view_team` | View leads within consultant's assigned team | ✅ | ✅ | ❌ | ❌ |
| `leads:view_assigned` | View leads assigned to user + unassigned pool | ✅ | ✅ | ✅ | ❌ |
| `leads:create` | Ingest and create new manual leads | ✅ | ✅ | ✅ | ❌ |
| `leads:edit` | Update lead specifications and requirements | ✅ | ✅ | ✅ (Own) | ❌ |
| `leads:assign` | Allocate/reassign lead to any consultant | ✅ | ✅ (Team) | ❌ | ❌ |
| `leads:delete` | Delete or purge duplicate/spam leads | ✅ | ❌ | ❌ | ❌ |
| `quotes:view` | View generated holiday proposals | ✅ | ✅ | ✅ | ✅ |
| `quotes:create` | Build quotations with markup calculator | ✅ | ✅ | ✅ | ❌ |
| `quotes:view_margins` | Inspect supplier net cost & gross margin % | ✅ | ✅ | ❌ (Locked) | ❌ |
| `quotes:approve` | Approve custom discounts or low-margin deals | ✅ | ✅ | ❌ | ❌ |
| `customers:view` | Access Customer 360 profiles & history | ✅ | ✅ | ✅ | ✅ |
| `customers:export_pii` | Export raw passport, email, and phone data | ✅ | ❌ | ❌ | ❌ |
| `tasks:manage_team` | Assign and oversee tasks across consultants | ✅ | ✅ | ❌ | ❌ |
| `analytics:financials` | Company revenue, booking quotas, profit margins | ✅ | ❌ | ❌ | ❌ |
| `analytics:team` | Team-level conversion velocity and response SLA | ✅ | ✅ | ❌ | ❌ |
| `settings:users` | Invite users, change roles, deactivate accounts | ✅ | ❌ | ❌ | ❌ |

---

## 3. Five-Phase Implementation Roadmap

### **Phase 1: RBAC Foundation & Granular Security Architecture (CURRENT FOCUS)**
* **Backend**:
  * Implement typed `Permission` enum and `ROLE_PERMISSIONS` mapping (`crm/services/api/app/rbac.py`).
  * Dependency guard `require_permission(perm)` and record filter `scope_leads_query(query, user)`.
  * Update `/leads`, `/leads/{id}/assign`, `/dashboard`, and `/users` routers to enforce permissions.
  * Write automated test suite (`tests/test_rbac.py`) verifying 403 Forbidden scenarios and query scoping.
* **Frontend**:
  * Role and permission utilities in `AuthContext` (`can(permission)`, `isRole(role)`).
  * Dynamic sidebar navigation filtering restricted modules.
  * Lead table/board filtered to role scope (Consultant sees own + unassigned pool).
  * Role switcher buttons on login page for seamless testing across all 4 personas.

### **Phase 2: Persistent Quotations & CPQ Engine with Role-Gated Margins**
* Relational tables: `proposals`, `proposal_options`, `proposal_items` (flights, hotels, activities).
* Financial privacy: Supplier net cost and profit margin % hidden from consultants; visible only to managers/admins.
* Tokenized client proposal URL (`/proposal/[id]`) with digital client acceptance.

### **Phase 3: Customer 360 & Contact Repository**
* Relational tables: `customers`, `customer_preferences` (dietary, room, frequent flyer), `customer_trips`.
* Automatic conversion from Lead to Customer upon deal won.
* PII masking for non-assigned team members.

### **Phase 4: Intelligent Lead Routing & SLA Escalation**
* Automated round-robin assignment based on destination expertise (e.g. Europe vs Domestic).
* SLA timer: Automatic manager alert when uncontacted after 15 minutes.

### **Phase 5: Operations & Post-Booking Fulfillment**
* Won deal handoff to Operations specialist.
* Voucher generation, flight PNR tracker, and payment schedule milestones.
