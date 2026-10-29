export type UserRole = "admin" | "manager" | "consultant" | "operations";

export type Permission =
  | "leads:view_all"
  | "leads:view_team"
  | "leads:view_assigned"
  | "leads:create"
  | "leads:edit"
  | "leads:assign"
  | "leads:delete"
  | "quotes:view"
  | "quotes:create"
  | "quotes:view_margins"
  | "quotes:approve"
  | "customers:view"
  | "customers:export_pii"
  | "tasks:manage_team"
  | "analytics:financials"
  | "analytics:team"
  | "settings:users";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  team_id?: string | null;
  permissions?: Permission[] | string[];
}

export type LeadStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiating"
  | "won"
  | "lost"
  | "junk";

export type LeadPriority = "urgent" | "high" | "medium" | "low";

export type LeadSource =
  | "callback_modal"
  | "website_enquiry"
  | "whatsapp"
  | "direct_call"
  | "referral"
  | "meta_ads"
  | "offline_walkin";

export type ActivityType = "note" | "call" | "whatsapp" | "email" | "status_change" | "assignment";

export type TaskStatus = "pending" | "completed" | "cancelled";

export interface LeadActivity {
  id: string;
  lead_id: string;
  author_id?: string | null;
  author_name?: string | null;
  activity_type: ActivityType;
  subject: string;
  content?: string | null;
  created_at: string;
}

export interface LeadTask {
  id: string;
  lead_id: string;
  assigned_to_id?: string | null;
  assigned_to_name?: string | null;
  title: string;
  due_date: string;
  status: TaskStatus;
  created_at: string;
  completed_at?: string | null;
}

export interface StatusHistoryItem {
  id: string;
  old_status: string;
  new_status: string;
  reason?: string | null;
  changed_by_name?: string | null;
  created_at: string;
}

export interface LeadListItem {
  id: string;
  lead_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  destination: string;
  travel_month?: string | null;
  pax_adults: number;
  pax_children: number;
  budget?: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to_id?: string | null;
  assigned_to_name?: string | null;
  next_follow_up_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadDetail extends LeadListItem {
  departure_city?: string | null;
  travel_style: string;
  notes?: string | null;
  loss_reason?: string | null;
  activities: LeadActivity[];
  tasks: LeadTask[];
  status_history: StatusHistoryItem[];
}

export interface LeadListResponse {
  items: LeadListItem[];
  total: number;
}

export interface DashboardMetrics {
  total_leads: number;
  new_leads: number;
  active_leads: number;
  won_leads: number;
  lost_leads: number;
  overdue_followups: number;
  conversion_rate: number;
  pipeline_by_stage: Record<string, number>;
  leads_by_source: Record<string, number>;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface ProposalItem {
  id: string;
  item_type: "hotel" | "flight" | "transfer" | "activity" | "visa" | "insurance";
  day_number?: number | null;
  title: string;
  description?: string | null;
  selling_price: number;
  is_optional: boolean;
  net_cost?: number | null;
}

export interface Proposal {
  id: string;
  proposal_code: string;
  lead_id?: string | null;
  created_by_id?: string | null;
  created_by_name?: string | null;
  title: string;
  destination: string;
  nights: number;
  pax_adults: number;
  pax_children: number;
  status: QuoteStatus;
  valid_until?: string | null;
  client_token: string;
  total_client_amount: number;
  per_person_amount: number;
  tax_percentage: number;
  tax_amount: number;
  currency: string;
  requires_approval: boolean;
  approved_by_id?: string | null;
  approved_by_name?: string | null;
  notes?: string | null;
  terms_and_conditions?: string | null;
  created_at: string;
  updated_at: string;
  supplier_cost?: number | null;
  markup_percentage?: number | null;
  profit_amount?: number | null;
  items?: ProposalItem[];
}

export interface Quote {
  id: string;
  quote_code: string;
  lead_id?: string;
  lead_code?: string;
  customer_name: string;
  customer_phone: string;
  destination: string;
  nights: number;
  pax_adults: number;
  pax_children: number;
  total_amount: number;
  currency: string;
  status: QuoteStatus;
  margin_percentage: number;
  valid_until: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  inquiries_count: number;
  completed_trips: number;
  lifetime_value: number;
  preferred_travel_style: string;
  last_interaction: string;
  tags: string[];
}

export interface DestinationGuide {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: "Europe" | "Middle East" | "Southeast Asia" | "Domestic India" | "Island Retreats" | "East Asia";
  best_months: string;
  visa_processing_days: string;
  ideal_duration: string;
  avg_cost_per_couple: string;
  currency: string;
  time_zone: string;
  key_highlights: string[];
  luxury_stays: string[];
  consultant_selling_tips: string;
  thumbnail_url?: string;
}

