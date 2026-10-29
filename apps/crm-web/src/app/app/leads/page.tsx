"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api-client";
import {
  LeadListItem,
  LeadStatus,
  LeadPriority,
  LeadSource,
  User,
} from "../../../lib/types";
import {
  Search,
  Plus,
  Filter,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  ChevronRight,
  X,
  AlertCircle,
  LayoutGrid,
  List,
  Phone,
  MessageCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // View Mode: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");

  // Create Slide-Over Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"contact" | "trip" | "assignment">("contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    destination: "",
    departure_city: "",
    travel_month: "",
    pax_adults: 2,
    pax_children: 0,
    budget: "",
    travel_style: "Luxury",
    notes: "",
    source: "website_enquiry" as LeadSource,
    priority: "medium" as LeadPriority,
    assigned_to_id: "",
  });

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const data = await api.leads.list({
        search: search.trim() || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        priority: selectedPriority !== "all" ? selectedPriority : undefined,
        assigned_to_id: selectedAssignee !== "all" ? selectedAssignee : undefined,
      });
      setLeads(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.users.list().then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedPriority, selectedAssignee]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.destination) {
      setFormError("Please fill in customer name, phone, and destination.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const created = await api.leads.create({
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        destination: formData.destination,
        departure_city: formData.departure_city || undefined,
        travel_month: formData.travel_month || undefined,
        pax_adults: Number(formData.pax_adults),
        pax_children: Number(formData.pax_children),
        budget: formData.budget || undefined,
        travel_style: formData.travel_style,
        notes: formData.notes || undefined,
        source: formData.source,
        priority: formData.priority,
        assigned_to_id: formData.assigned_to_id || undefined,
      });

      setIsDrawerOpen(false);
      setFormData({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        destination: "",
        departure_city: "",
        travel_month: "",
        pax_adults: 2,
        pax_children: 0,
        budget: "",
        travel_style: "Luxury",
        notes: "",
        source: "website_enquiry",
        priority: "medium",
        assigned_to_id: "",
      });
      router.push(`/app/leads/${created.id}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdvanceStage = async (leadId: string, currentStatus: LeadStatus) => {
    const stageOrder: LeadStatus[] = [
      "new",
      "assigned",
      "contacted",
      "qualified",
      "proposal_sent",
      "negotiating",
      "won",
    ];
    const currentIndex = stageOrder.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      try {
        await api.leads.updateStatus(leadId, nextStage, `Quick advanced from pipeline board`);
        await fetchLeads();
      } catch (err) {
        console.error("Failed to advance stage", err);
      }
    }
  };

  const statusBadge = (status: LeadStatus) => {
    const config: Record<LeadStatus, { bg: string; text: string; label: string }> = {
      new: { bg: "bg-blue-100/90", text: "text-blue-900 border-blue-300", label: "New" },
      assigned: { bg: "bg-indigo-100/90", text: "text-indigo-900 border-indigo-300", label: "Assigned" },
      contacted: { bg: "bg-purple-100/90", text: "text-purple-900 border-purple-300", label: "Contacted" },
      qualified: { bg: "bg-teal-100/90", text: "text-teal-900 border-teal-300", label: "Qualified" },
      proposal_sent: { bg: "bg-amber-100/90", text: "text-amber-900 border-amber-300", label: "Proposal Sent" },
      negotiating: { bg: "bg-orange-100/90", text: "text-orange-900 border-orange-300", label: "Negotiating" },
      won: { bg: "bg-emerald-100/90", text: "text-emerald-900 border-emerald-300", label: "Won" },
      lost: { bg: "bg-rose-100/90", text: "text-rose-900 border-rose-300", label: "Lost" },
      junk: { bg: "bg-slate-100/90", text: "text-slate-800 border-slate-300", label: "Junk" },
    };
    const c = config[status] || { bg: "bg-slate-100", text: "text-slate-800 border-slate-300", label: status };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const priorityBadge = (priority: LeadPriority) => {
    const config: Record<LeadPriority, { bg: string; text: string; label: string }> = {
      urgent: { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "Urgent", label: "Urgent" },
      high: { bg: "bg-orange-50 text-orange-700 border-orange-200", text: "High", label: "High" },
      medium: { bg: "bg-slate-50 text-slate-700 border-slate-200", text: "Medium", label: "Medium" },
      low: { bg: "bg-slate-50 text-slate-500 border-slate-200", text: "Low", label: "Low" },
    };
    const p = config[priority] || config.medium;
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${p.bg}`}>
        {p.label}
      </span>
    );
  };

  // Kanban Stage Columns
  const kanbanColumns: { id: LeadStatus; label: string; color: string; accent: string }[] = [
    { id: "new", label: "New Leads", color: "bg-blue-500", accent: "border-blue-200 bg-blue-50/50" },
    { id: "contacted", label: "Contacted", color: "bg-purple-500", accent: "border-purple-200 bg-purple-50/50" },
    { id: "qualified", label: "Qualified", color: "bg-teal-500", accent: "border-teal-200 bg-teal-50/50" },
    { id: "proposal_sent", label: "Proposal Sent", color: "bg-amber-500", accent: "border-amber-200 bg-amber-50/50" },
    { id: "negotiating", label: "Negotiating", color: "bg-orange-500", accent: "border-orange-200 bg-orange-50/50" },
    { id: "won", label: "Won (Booked)", color: "bg-emerald-500", accent: "border-emerald-200 bg-emerald-50/50" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leads & Inquiries Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end sales pipeline from discovery call to confirmed booking deposit
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone, email, lead code or destination..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Consultants</option>
              <option value="unassigned">Unassigned Only</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stage Filter Tabs (Table Mode Only) */}
        {viewMode === "table" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs border-t border-slate-100">
            {[
              { id: "all", label: "All Stages" },
              { id: "new", label: "New" },
              { id: "assigned", label: "Assigned" },
              { id: "contacted", label: "Contacted" },
              { id: "qualified", label: "Qualified" },
              { id: "proposal_sent", label: "Proposal Sent" },
              { id: "negotiating", label: "Negotiating" },
              { id: "won", label: "Won" },
              { id: "lost", label: "Lost" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedStatus === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area: Kanban Board or Table */}
      {isLoading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : viewMode === "kanban" ? (
        /* ── KANBAN BOARD VIEW ── */
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-[1280px]">
            {kanbanColumns.map((col) => {
              const columnLeads = leads.filter((l) => l.status === col.id);

              return (
                <div
                  key={col.id}
                  className="w-80 flex-shrink-0 bg-slate-100/70 rounded-2xl border border-slate-200 flex flex-col max-h-[750px]"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                      <span className="font-extrabold text-xs text-slate-800">{col.label}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {columnLeads.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="p-3 overflow-y-auto space-y-3 flex-1 kanban-scroll">
                    {columnLeads.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-400">
                        No inquiries in {col.label.toLowerCase()}
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition space-y-3 cursor-pointer group"
                          onClick={() => router.push(`/app/leads/${lead.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-teal-700">
                              {lead.lead_code}
                            </span>
                            {priorityBadge(lead.priority)}
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                              {lead.customer_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{lead.customer_phone}</span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                              <MapPin className="h-3 w-3 text-teal-600 shrink-0" />
                              <span className="truncate">{lead.destination}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500">
                              <span>
                                {lead.pax_adults} Adults {lead.pax_children > 0 && `• ${lead.pax_children} Kids`}
                              </span>
                              <span className="font-bold text-slate-800">{lead.budget || "Quote req."}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-slate-600">
                              <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center">
                                {lead.assigned_to_name ? lead.assigned_to_name.charAt(0) : "?"}
                              </div>
                              <span className="truncate max-w-[90px] font-medium">
                                {lead.assigned_to_name ? lead.assigned_to_name.split(" ")[0] : "Unassigned"}
                              </span>
                            </div>

                            {/* One-click Advance button */}
                            {col.id !== "won" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAdvanceStage(lead.id, lead.status);
                                }}
                                title="Advance to next stage"
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-500 hover:text-white text-slate-600 transition font-bold"
                              >
                                <span>Advance</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── DATA TABLE VIEW ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {leads.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No leads found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No inquiries match your current filters. Clear the search or create a new lead to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Lead Code</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Destination & Month</th>
                    <th className="py-3 px-4">PAX / Budget</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/app/leads/${lead.id}`)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                        {lead.lead_code}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition">
                          {lead.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-500">{lead.customer_phone}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{lead.destination}</div>
                        <div className="text-[11px] text-slate-400">
                          {lead.travel_month || "Date Flexible"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {lead.pax_adults} Adults {lead.pax_children > 0 && `• ${lead.pax_children} Kids`}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {lead.budget || "Custom Quote"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{priorityBadge(lead.priority)}</td>

                      <td className="py-3.5 px-4">{statusBadge(lead.status)}</td>

                      <td className="py-3.5 px-4">
                        {lead.assigned_to_name ? (
                          <span className="font-medium text-slate-800">{lead.assigned_to_name}</span>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center text-slate-400 group-hover:text-teal-600 transition">
                          <span className="text-[11px] font-semibold mr-1">Manage</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SLIDE-OVER DRAWER: CREATE NEW LEAD ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Create New Travel Lead</h3>
                <p className="text-xs text-slate-500">Record a customer holiday inquiry into CRM</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step Navigation Tabs */}
            <div className="flex border-b border-slate-100 text-xs font-bold px-6 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setDrawerTab("contact")}
                className={`py-3 px-3 border-b-2 transition ${
                  drawerTab === "contact"
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. Contact Info
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("trip")}
                className={`py-3 px-3 border-b-2 transition ${
                  drawerTab === "trip"
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                2. Requirements
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("assignment")}
                className={`py-3 px-3 border-b-2 transition ${
                  drawerTab === "assignment"
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3. Allocation & Notes
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleCreateLead} className="p-6 flex-1 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tab 1: Contact Info */}
              {drawerTab === "contact" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="e.g. Dr. Sameer Kulkarni"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number * (Primary WhatsApp)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="e.g. +91 98201 54321"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="e.g. sameer.kulkarni@gmail.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Departure City
                    </label>
                    <input
                      type="text"
                      value={formData.departure_city}
                      onChange={(e) => setFormData({ ...formData, departure_city: e.target.value })}
                      placeholder="e.g. Mumbai (BOM), Delhi (DEL), Bengaluru"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("trip")}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      Next: Holiday Requirements →
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Trip Requirements */}
              {drawerTab === "trip" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Destination *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="e.g. Switzerland Scenic Alps, Bali, Maldives"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Travel Month / Window
                      </label>
                      <input
                        type="text"
                        value={formData.travel_month}
                        onChange={(e) => setFormData({ ...formData, travel_month: e.target.value })}
                        placeholder="e.g. June 2026"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Travel Style
                      </label>
                      <select
                        value={formData.travel_style}
                        onChange={(e) => setFormData({ ...formData, travel_style: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Ultra Luxury">Ultra Luxury</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Honeymoon Special">Honeymoon Special</option>
                        <option value="Family Leisure">Family Leisure</option>
                        <option value="Boutique Heritage">Boutique Heritage</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Adult Travelers
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.pax_adults}
                        onChange={(e) => setFormData({ ...formData, pax_adults: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Children (under 12)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pax_children}
                        onChange={(e) => setFormData({ ...formData, pax_children: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimated Budget (INR ₹)
                    </label>
                    <input
                      type="text"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="e.g. ₹5,00,000 - ₹7,00,000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("contact")}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab("assignment")}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                    >
                      Next: Consultant & Notes →
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Assignment & Provenance */}
              {drawerTab === "assignment" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assign To Travel Consultant
                    </label>
                    <select
                      value={formData.assigned_to_id}
                      onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      <option value="">Leave Unassigned (Shared Inbox)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inquiry Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Acquisition Source
                      </label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                      >
                        <option value="website_enquiry">Website Enquiry</option>
                        <option value="callback_modal">Callback Modal</option>
                        <option value="whatsapp">WhatsApp Direct</option>
                        <option value="direct_call">Direct Call</option>
                        <option value="referral">Client Referral</option>
                        <option value="meta_ads">Meta Ads</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Client Trip Notes & Preferences
                    </label>
                    <textarea
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special dietary needs, preferred flight class, anniversary arrangements, resort requests..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDrawerTab("trip")}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isSubmitting ? "Saving Lead..." : "Save & Open Lead Details"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
