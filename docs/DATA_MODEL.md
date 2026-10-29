# Jeto Vacations CRM — Data Model & Schema

## Entity Relationship Overview

```mermaid
erDiagram
    TEAM ||--o{ USER : contains
    USER ||--o{ LEAD : assigned_to
    USER ||--o{ LEAD_ACTIVITY : author
    USER ||--o{ LEAD_TASK : assigned_to
    LEAD ||--o{ LEAD_ACTIVITY : logs
    LEAD ||--o{ LEAD_TASK : schedules
    LEAD ||--o{ LEAD_STATUS_HISTORY : tracks

    TEAM {
        string id PK
        string name
        string description
        datetime created_at
    }

    USER {
        string id PK
        string email UK
        string hashed_password
        string full_name
        string phone
        string role
        boolean is_active
        string team_id FK
        datetime created_at
    }

    LEAD {
        string id PK
        string lead_code UK
        string customer_name
        string customer_phone
        string customer_email
        string destination
        string departure_city
        string travel_month
        int pax_adults
        int pax_children
        string budget
        string travel_style
        string source
        string status
        string priority
        string loss_reason
        string assigned_to_id FK
        datetime next_follow_up_at
        datetime created_at
        datetime updated_at
    }

    LEAD_ACTIVITY {
        string id PK
        string lead_id FK
        string author_id FK
        string activity_type
        string subject
        text content
        datetime created_at
    }

    LEAD_TASK {
        string id PK
        string lead_id FK
        string assigned_to_id FK
        string title
        datetime due_date
        string status
        datetime completed_at
    }

    LEAD_STATUS_HISTORY {
        string id PK
        string lead_id FK
        string changed_by_id FK
        string old_status
        string new_status
        string reason
        datetime created_at
    }

    AUDIT_LOG {
        string id PK
        string user_id
        string action
        string entity_type
        string entity_id
        json details
        string ip_address
        datetime created_at
    }
```

## Enum Definitions
- **UserRole**: `admin`, `manager`, `consultant`, `operations`
- **LeadStatus**: `new`, `assigned`, `contacted`, `qualified`, `proposal_sent`, `negotiating`, `won`, `lost`, `junk`
- **LeadPriority**: `urgent`, `high`, `medium`, `low`
- **LeadSource**: `callback_modal`, `website_enquiry`, `whatsapp`, `direct_call`, `referral`, `meta_ads`, `offline_walkin`
- **ActivityType**: `note`, `call`, `whatsapp`, `email`, `status_change`, `assignment`
- **TaskStatus**: `pending`, `completed`, `cancelled`
