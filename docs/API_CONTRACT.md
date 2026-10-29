# Jeto Vacations CRM — API Contract & Specification

Base URL: `http://localhost:8000/api/v1`

All authenticated endpoints require header:
`Authorization: Bearer <access_token>`

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates a user and issues a JWT token.
- **Request Body**:
  ```json
  {
    "email": "consultant@jetovacations.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "consultant@jetovacations.com",
      "full_name": "Neha Kapoor",
      "role": "consultant",
      "is_active": true,
      "team_id": "uuid"
    }
  }
  ```

### `GET /auth/me`
Retrieves the authenticated user's profile.
- **Response `200 OK`**: `UserResponse` object.

---

## 2. Lead Management Endpoints

### `GET /leads`
Lists leads with filtering, search, and pagination.
- **Query Parameters**:
  - `status`: string (`new`, `assigned`, `contacted`, `qualified`, `proposal_sent`, `negotiating`, `won`, `lost`)
  - `priority`: string (`urgent`, `high`, `medium`, `low`)
  - `source`: string (`website_enquiry`, `callback_modal`, etc.)
  - `assigned_to_id`: string (user id or `unassigned`)
  - `search`: string (matches customer name, phone, email, lead code, destination)
  - `skip`: int (default 0)
  - `limit`: int (default 50, max 100)
- **Response `200 OK`**:
  ```json
  {
    "items": [...],
    "total": 42
  }
  ```

### `POST /leads`
Creates a new lead manually from CRM.
- **Request Body**:
  ```json
  {
    "customer_name": "Vikram Sethi",
    "customer_phone": "+91 98765 43210",
    "customer_email": "vikram@example.com",
    "destination": "Switzerland Scenic Alps",
    "departure_city": "Mumbai",
    "travel_month": "June 2026",
    "pax_adults": 2,
    "pax_children": 0,
    "budget": "₹6,00,000",
    "travel_style": "Luxury",
    "notes": "1st class train pass requested.",
    "source": "website_enquiry",
    "priority": "high",
    "assigned_to_id": "uuid"
  }
  ```
- **Response `201 Created`**: `LeadDetail` object.

### `GET /leads/{id}`
Retrieves full details of a lead including activity logs, tasks, and status history.
- **Response `200 OK`**: `LeadDetail` object.

### `PATCH /leads/{id}/status`
Transitions a lead's stage and records audit history.
- **Request Body**:
  ```json
  {
    "status": "contacted",
    "reason": "Discovery call completed with client"
  }
  ```
- **Response `200 OK`**: `LeadDetail` object.

### `PATCH /leads/{id}/assign`
Assigns or reassigns lead to a consultant.
- **Request Body**:
  ```json
  {
    "assigned_to_id": "uuid"
  }
  ```

### `POST /leads/{id}/activities`
Logs an interaction (call log, note, email, WhatsApp).
- **Request Body**:
  ```json
  {
    "activity_type": "call",
    "subject": "Follow-up Call with Client",
    "content": "Discussed 5-star hotel options in Interlaken."
  }
  ```

### `POST /leads/{id}/tasks`
Schedules a follow-up task.
- **Request Body**:
  ```json
  {
    "title": "Send updated quotation",
    "due_date": "2026-06-15T10:00:00Z"
  }
  ```

### `PATCH /leads/{id}/tasks/{taskId}`
Updates task status (e.g. `completed`).
- **Request Body**:
  ```json
  {
    "status": "completed"
  }
  ```

---

## 3. Dashboard Endpoints

### `GET /dashboard/metrics`
Computes live KPI metrics across all leads.
- **Response `200 OK`**:
  ```json
  {
    "total_leads": 8,
    "new_leads": 1,
    "active_leads": 5,
    "won_leads": 1,
    "lost_leads": 1,
    "overdue_followups": 0,
    "conversion_rate": 50.0,
    "pipeline_by_stage": { "new": 1, "contacted": 1, ... },
    "leads_by_source": { "website_enquiry": 3, ... }
  }
  ```

---

## 4. Public Ingestion Endpoints (No Auth Required)

### `POST /public/weblead`
Endpoint for public website (`jet-web`) to submit leads safely.
- **Request Body**:
  ```json
  {
    "customer_name": "Rohan Bhatt",
    "customer_phone": "+91 98791 44556",
    "customer_email": "rohan@example.com",
    "destination": "Japan Cherry Blossom",
    "pax_adults": 2,
    "pax_children": 0,
    "source": "website_enquiry"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "lead_code": "JV-2026-4821",
    "message": "Thank you! Your travel request has been logged and assigned for review."
  }
  ```
