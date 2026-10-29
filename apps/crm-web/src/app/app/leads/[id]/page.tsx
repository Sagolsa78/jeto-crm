"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../../../lib/api-client";
import { useAuth } from "../../../../context/AuthContext";
import {
  LeadDetail,
  LeadStatus,
  LeadPriority,
  ActivityType,
  User,
} from "../../../../lib/types";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Plus,
  Send,
  UserCheck,
  History,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
  MessageCircle,
  FileText,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { INITIAL_QUOTES } from "../../../../lib/mock-modules";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  const router = useRouter();
  const { canAssignLead } = useAuth();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Change Dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");

  // Activity Form
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityContent, setActivityContent] = useState("");
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Task Form
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fetchLead = async () => {
    try {
      const data = await api.leads.get(leadId);
      setLead(data);
    } catch (err: any) {
      setError(err.message || "Failed to load lead");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
    api.users.list().then(setUsers).catch(console.error);
  }, [leadId]);

  const handleStatusSelect = (newStatus: LeadStatus) => {
    if (newStatus === lead?.status) return;

    if (newStatus === "lost" || newStatus === "junk" || newStatus === "contacted") {
      setPendingStatus(newStatus);
      setStatusReason("");
      setIsStatusDialogOpen(true);
    } else {
      executeStatusUpdate(newStatus);
    }
  };

  const executeStatusUpdate = async (status: LeadStatus, reason?: string) => {
    if (!lead) return;
    try {
      const updated = await api.leads.updateStatus(lead.id, status, reason);
      setLead(updated);
      setIsStatusDialogOpen(false);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    if (!lead) return;
    try {
      const updated = await api.leads.assign(lead.id, userId);
      setLead(updated);
    } catch (err: any) {
      alert(`Error assigning lead: ${err.message}`);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !activitySubject.trim()) return;

    setIsSubmittingActivity(true);
    try {
      await api.leads.addActivity(lead.id, {
        activity_type: activityType,
        subject: activitySubject.trim(),
        content: activityContent.trim() || undefined,
      });
      setActivitySubject("");
      setActivityContent("");
      await fetchLead();
    } catch (err: any) {
      alert(`Error adding activity: ${err.message}`);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !taskTitle.trim() || !taskDueDate) return;

    setIsSubmittingTask(true);
    try {
      await api.leads.addTask(lead.id, {
        title: taskTitle.trim(),
        due_date: new Date(taskDueDate).toISOString(),
      });
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDueDate("");
      await fetchLead();
    } catch (err: any) {
      alert(`Error adding task: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (!lead) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await api.leads.updateTask(lead.id, taskId, { status: newStatus });
      await fetchLead();
    } catch (err: any) {
      alert(`Error toggling task: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-2xl border border-rose-200 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Lead Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {error || "The requested lead could not be retrieved from the database."}
        </p>
        <Link
          href="/app/leads"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Leads Pipeline</span>
        </Link>
      </div>
    );
  }

  // Pipeline Stepper Stages
  const stepperStages: { id: LeadStatus; label: string }[] = [
    { id: "new", label: "New Lead" },
    { id: "contacted", label: "Contacted" },
    { id: "qualified", label: "Qualified" },
    { id: "proposal_sent", label: "Proposal Sent" },
    { id: "negotiating", label: "Negotiating" },
    { id: "won", label: "Won Booking" },
  ];

  const currentStageIndex = stepperStages.findIndex((s) => s.id === lead.status);

  // WhatsApp click-to-chat URL
  const cleanPhone = lead.customer_phone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
    lead.customer_name
  )},%20greetings%20from%20Jeto%20Vacations%20regarding%20your%20holiday%20to%20${encodeURIComponent(
    lead.destination
  )}.`;

  // Linked quotes from mock or lead
  const linkedQuotes = INITIAL_QUOTES.filter(
    (q) => q.lead_code === lead.lead_code || q.customer_name === lead.customer_name
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Link
                href="/app/leads"
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                {lead.lead_code}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {lead.source.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded uppercase bg-amber-50 text-amber-800 border border-amber-200">
                {lead.priority} Priority
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {lead.customer_name}
            </h1>

            {/* Quick Action Contact Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <a
                href={`tel:${lead.customer_phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5 text-teal-600" />
                <span>{lead.customer_phone}</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Chat on WhatsApp</span>
              </a>

              {lead.customer_email && (
                <a
                  href={`mailto:${lead.customer_email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{lead.customer_email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Consultant Assignment & Quick Stage Select */}
          <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-slate-400 mb-1">
                Consultant Owner
              </span>
              {canAssignLead() ? (
                <select
                  value={lead.assigned_to_id || ""}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 font-semibold rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs"
                >
                  <option value="" disabled>
                    Assign Consultant
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 font-semibold rounded-xl text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs">
                  <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                  <span>{lead.assigned_to_name || "Unassigned Inbound Pool"}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold text-slate-400 mb-1">
                Current Pipeline Stage
              </span>
              <select
                value={lead.status}
                onChange={(e) => handleStatusSelect(e.target.value as LeadStatus)}
                className="px-3 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs"
              >
                <option value="new">NEW ENQUIRY</option>
                <option value="assigned">ASSIGNED</option>
                <option value="contacted">CONTACTED</option>
                <option value="qualified">QUALIFIED</option>
                <option value="proposal_sent">PROPOSAL SENT</option>
                <option value="negotiating">NEGOTIATING</option>
                <option value="won">WON (CONFIRMED)</option>
                <option value="lost">LOST / CLOSED</option>
                <option value="junk">JUNK / SPAM</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── VISUAL PIPELINE STEPPER ── */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs overflow-x-auto pb-2">
            {stepperStages.map((step, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = lead.status === step.id;
              const isWon = lead.status === "won";

              return (
                <div key={step.id} className="flex items-center flex-1 min-w-[120px]">
                  <button
                    onClick={() => handleStatusSelect(step.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg transition cursor-pointer ${
                      isCurrent
                        ? isWon
                          ? "bg-emerald-50 text-emerald-800 font-extrabold"
                          : "bg-teal-50 text-teal-800 font-extrabold"
                        : isPast
                        ? "text-slate-700 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? isWon
                            ? "bg-emerald-600 text-white"
                            : "bg-teal-600 text-white"
                          : isPast
                          ? "bg-slate-300 text-slate-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span>{step.label}</span>
                  </button>

                  {idx < stepperStages.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isPast ? "bg-teal-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN WORKSTATION LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Client Profile & Trip Details (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Holiday Requirements</span>
              <MapPin className="h-4 w-4 text-teal-600" />
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Destination</span>
                <span className="text-sm font-extrabold text-slate-900">{lead.destination}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-medium block">Departure City</span>
                  <span className="font-semibold text-slate-800">
                    {lead.departure_city || "Flexible (India)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Travel Window</span>
                  <span className="font-semibold text-slate-800">
                    {lead.travel_month || "Flexible"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-medium block">Travelers</span>
                  <span className="font-semibold text-slate-800">
                    {lead.pax_adults} Adults {lead.pax_children > 0 && `• ${lead.pax_children} Kids`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Travel Style</span>
                  <span className="font-semibold text-slate-800">{lead.travel_style}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Client Target Budget</span>
                <span className="font-extrabold text-teal-800 text-sm">
                  {lead.budget || "Custom Quote on Request"}
                </span>
              </div>

              {lead.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-medium block mb-1">Trip Notes & Preferences</span>
                  <p className="bg-slate-50 p-3 rounded-xl text-slate-700 leading-relaxed italic border border-slate-100">
                    "{lead.notes}"
                  </p>
                </div>
              )}

              {lead.loss_reason && (
                <div className="pt-2 border-t border-rose-100">
                  <span className="text-rose-600 font-bold block mb-1 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Reason Inquiry Was Lost</span>
                  </span>
                  <p className="bg-rose-50 p-3 rounded-xl text-rose-900 border border-rose-200">
                    {lead.loss_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Quotations Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Linked Quotations</span>
              </h2>

              <Link
                href="/app/quotes"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Quote</span>
              </Link>
            </div>

            {linkedQuotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No formal proposal attached yet.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-indigo-700">{q.quote_code}</span>
                      <span className="font-bold text-[11px] uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
                        {q.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{q.nights}N Itinerary</span>
                      <span className="font-extrabold text-slate-900">
                        ₹{(q.total_amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Interaction Logger & Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Interaction Logger */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Log Consultant Interaction
            </h2>

            {/* Interaction Type Selector */}
            <div className="flex items-center gap-2">
              {[
                { type: "call", label: "Phone Call" },
                { type: "whatsapp", label: "WhatsApp" },
                { type: "note", label: "Internal Note" },
                { type: "email", label: "Email" },
              ].map((tab) => (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setActivityType(tab.type as ActivityType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activityType === tab.type
                      ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  value={activitySubject}
                  onChange={(e) => setActivitySubject(e.target.value)}
                  placeholder="Subject / Summary (e.g. Sent hotel options, Discussed budget)..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  placeholder="Detailed notes on what the client requested or what was promised..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingActivity || !activitySubject.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmittingActivity ? "Logging..." : "Record Activity"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Activity & Audit Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <span>Lead History & Activity Timeline</span>
            </h2>

            {lead.activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recorded activity yet.</p>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {lead.activities.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Bullet marker */}
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-white border-2 border-teal-500" />

                    <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{act.subject}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded bg-slate-200 text-slate-700">
                            {act.activity_type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>

                      {act.content && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {act.content}
                        </p>
                      )}

                      <div className="text-[11px] text-slate-400 pt-1 font-medium">
                        By {act.author_name || "System"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Follow-up Tasks (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Follow-up Tasks</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {lead.tasks.filter((t) => t.status === "pending").length}
                </span>
              </h2>

              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {lead.tasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No follow-ups scheduled yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lead.tasks.map((task) => {
                  const isCompleted = task.status === "completed";
                  const isOverdue = !isCompleted && new Date(task.due_date) < new Date();

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition flex items-start gap-3 ${
                        isCompleted
                          ? "bg-slate-50/60 border-slate-200 opacity-60"
                          : isOverdue
                          ? "bg-rose-50/50 border-rose-200"
                          : "bg-white border-slate-200 shadow-2xs"
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className="mt-0.5 text-slate-400 hover:text-teal-600 cursor-pointer shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 text-xs">
                        <p
                          className={`font-semibold ${
                            isCompleted ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span
                            className={
                              isOverdue
                                ? "text-rose-600 font-bold"
                                : isCompleted
                                ? "text-slate-400"
                                : "text-slate-500"
                            }
                          >
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STATUS REASON MODAL ── */}
      {isStatusDialogOpen && pendingStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Status Transition to {pendingStatus.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500">
              Please provide notes or context for this stage change to maintain sales accountability.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Consultant Notes
              </label>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Budget mismatch, client chose competitor, booked flights elsewhere..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusDialogOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeStatusUpdate(pendingStatus, statusReason)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE TASK MODAL ── */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Schedule Follow-up Task</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Send finalized quotation with 5-star Interlaken hotel"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 cursor-pointer"
                >
                  {isSubmittingTask ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
