import {
  User,
  LeadDetail,
  LeadListResponse,
  LeadActivity,
  LeadTask,
  DashboardMetrics,
  LeadStatus,
  LeadPriority,
  LeadSource,
  ActivityType,
  Proposal,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jeto_crm_token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData.detail) {
        errorDetail =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // response wasn't JSON
    }

    if (response.status === 401 && typeof window !== "undefined") {
      // Clear token on 401
      localStorage.removeItem("jeto_crm_token");
      localStorage.removeItem("jeto_crm_user");
    }

    throw new ApiError(response.status, errorDetail, errorData);
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      return request<{
        access_token: string;
        token_type: string;
        user: User;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    me: async () => {
      return request<User>("/auth/me");
    },
  },

  users: {
    list: async (role?: string) => {
      const q = role ? `?role=${role}` : "";
      return request<User[]>(`/users${q}`);
    },
  },

  dashboard: {
    getMetrics: async () => {
      return request<DashboardMetrics>("/dashboard/metrics");
    },
  },

  leads: {
    list: async (params?: {
      status?: string;
      priority?: string;
      source?: string;
      assigned_to_id?: string;
      search?: string;
      skip?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== "all") searchParams.set("status", params.status);
      if (params?.priority && params.priority !== "all") searchParams.set("priority", params.priority);
      if (params?.source && params.source !== "all") searchParams.set("source", params.source);
      if (params?.assigned_to_id && params.assigned_to_id !== "all")
        searchParams.set("assigned_to_id", params.assigned_to_id);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.skip) searchParams.set("skip", params.skip.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());

      const qs = searchParams.toString();
      return request<LeadListResponse>(`/leads${qs ? `?${qs}` : ""}`);
    },

    get: async (id: string) => {
      return request<LeadDetail>(`/leads/${id}`);
    },

    create: async (data: {
      customer_name: string;
      customer_phone: string;
      customer_email?: string;
      destination: string;
      departure_city?: string;
      travel_month?: string;
      pax_adults: number;
      pax_children: number;
      budget?: string;
      travel_style?: string;
      notes?: string;
      source?: LeadSource;
      priority?: LeadPriority;
      assigned_to_id?: string;
    }) => {
      return request<LeadDetail>("/leads", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<LeadDetail>) => {
      return request<LeadDetail>(`/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    updateStatus: async (id: string, status: LeadStatus, reason?: string) => {
      return request<LeadDetail>(`/leads/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      });
    },

    assign: async (id: string, assigned_to_id: string) => {
      return request<LeadDetail>(`/leads/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ assigned_to_id }),
      });
    },

    addActivity: async (
      id: string,
      data: {
        activity_type: ActivityType;
        subject: string;
        content?: string;
      }
    ) => {
      return request<LeadActivity>(`/leads/${id}/activities`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    addTask: async (
      id: string,
      data: {
        title: string;
        due_date: string;
        assigned_to_id?: string;
      }
    ) => {
      return request<LeadTask>(`/leads/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    updateTask: async (
      leadId: string,
      taskId: string,
      data: {
        title?: string;
        due_date?: string;
        status?: string;
      }
    ) => {
      return request<LeadTask>(`/leads/${leadId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  proposals: {
    list: async (params?: { lead_id?: string; status?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.lead_id) query.append("lead_id", params.lead_id);
      if (params?.status) query.append("status", params.status);
      if (params?.search) query.append("search", params.search);
      const qs = query.toString();
      return request<{
        items: Proposal[];
        total: number;
        total_pipeline_value: number;
        average_margin_percentage?: number | null;
      }>(`/proposals${qs ? `?${qs}` : ""}`);
    },

    get: async (id: string) => {
      return request<Proposal>(`/proposals/${id}`);
    },

    create: async (data: {
      lead_id?: string;
      title: string;
      destination: string;
      nights: number;
      pax_adults: number;
      pax_children?: number;
      supplier_cost: number;
      markup_percentage: number;
      tax_percentage?: number;
      currency?: string;
      notes?: string;
      terms_and_conditions?: string;
      items?: Array<{
        item_type: string;
        day_number?: number;
        title: string;
        description?: string;
        net_cost?: number;
        selling_price: number;
      }>;
    }) => {
      return request<Proposal>("/proposals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      data: {
        title?: string;
        status?: string;
        supplier_cost?: number;
        markup_percentage?: number;
        notes?: string;
      }
    ) => {
      return request<Proposal>(`/proposals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    approve: async (id: string) => {
      return request<Proposal>(`/proposals/${id}/approve`, {
        method: "POST",
      });
    },

    getPublic: async (clientToken: string) => {
      return request<any>(`/proposals/public/${clientToken}`);
    },

    acceptPublic: async (clientToken: string) => {
      return request<{ status: string; message: string; proposal_code: string }>(
        `/proposals/public/${clientToken}/accept`,
        { method: "POST" }
      );
    },
  },
};
