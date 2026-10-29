# Jeto Vacations CRM — Requirements Specification

## 1. Business Purpose
Jeto Vacations sells luxury domestic and international holiday packages. To scale sales and travel operations, the business requires a reliable CRM system to manage the end-to-end customer journey from website inquiry to trip completion.

## 2. User Roles & Personas
1. **Admin / Management**:
   - Views overall company pipeline, conversion rates, and consultant performance.
   - Assigns leads across teams and reassigns dormant inquiries.
2. **Travel Consultant**:
   - Manages personal inbox of assigned travel leads.
   - Logs customer interaction notes, phone calls, and WhatsApp discussions.
   - Schedules and tracks follow-up tasks to prevent deals from slipping.
   - Prepares and sends holiday quotations.
3. **Operations Specialist**:
   - Manages bookings, supplier vouchers, flights, and post-booking fulfillment once deals are won.

## 3. Core Functional Requirements

### FR-01: Lead Acquisition & Ingestion
- Capture leads from website contact forms, package callback modals, direct phone calls, WhatsApp, and advertising channels.
- Generate unique human-readable lead codes (e.g. `JV-2026-101`).
- Enforce phone number and destination requirements.

### FR-02: Pipeline & Stage Workflow
- Track lead status across defined lifecycle stages:
  - `new`: Inbound inquiry awaiting consultant allocation.
  - `assigned`: Allocated to consultant.
  - `contacted`: Initial discovery call completed.
  - `qualified`: Traveler dates, pax, budget, and destination confirmed.
  - `proposal_sent`: Detailed itinerary and pricing shared.
  - `negotiating`: Revisions and hotel upgrades in discussion.
  - `won`: Booking confirmed with client deposit.
  - `lost`: Closed without booking (mandatory reason logging).
  - `junk`: Invalid phone or spam inquiry.

### FR-03: Activity & Audit Logging
- Every interaction (note, phone call, email, status change, consultant assignment) must be recorded chronologically with author identity and timestamp.

### FR-04: Task Management & Follow-ups
- Consultants can schedule time-bound follow-up tasks.
- System highlights overdue tasks to ensure high lead responsiveness.
