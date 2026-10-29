"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  X,
} from "lucide-react";

interface AgendaTask {
  id: string;
  title: string;
  customer_name: string;
  lead_code?: string;
  destination?: string;
  due_date: string;
  is_overdue: boolean;
  priority: "urgent" | "high" | "medium";
  assigned_to: string;
  status: "pending" | "completed";
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<AgendaTask[]>([
    {
      id: "task-1",
      title: "Review Alpine Explorer 8N hotel options & Swiss Travel Pass pricing",
      customer_name: "Dr. Sameer & Ritu Kulkarni",
      lead_code: "JV-2026-101",
      destination: "Switzerland Scenic Alps",
      due_date: "2026-10-30T16:00:00Z",
      is_overdue: false,
      priority: "high",
      assigned_to: "Neha Kapoor",
      status: "pending",
    },
    {
      id: "task-2",
      title: "Immediate callback for Kashmir honeymoon Gondola tickets inquiry",
      customer_name: "Kavita Deshmukh",
      lead_code: "JV-2026-104",
      destination: "Kashmir Paradise 6N",
      due_date: "2026-10-30T11:00:00Z",
      is_overdue: true,
      priority: "urgent",
      assigned_to: "Rahul Sharma",
      status: "pending",
    },
    {
      id: "task-3",
      title: "Confirm Atlantis The Royal sky pool suite availability & rates",
      customer_name: "Harish Choudhary",
      lead_code: "JV-2026-106",
      destination: "Dubai Ultra Luxury",
      due_date: "2026-10-31T14:00:00Z",
      is_overdue: false,
      priority: "high",
      assigned_to: "Neha Kapoor",
      status: "pending",
    },
    {
      id: "task-4",
      title: "Send Japan tourist visa document checklist for autumn travel",
      customer_name: "Rohan & Meera Bhatt",
      lead_code: "JV-2026-105",
      destination: "Japan Cherry Blossom",
      due_date: "2026-11-02T10:00:00Z",
      is_overdue: false,
      priority: "medium",
      assigned_to: "Rahul Sharma",
      status: "pending",
    },
    {
      id: "task-5",
      title: "Dispatched seaplane transfer vouchers to Maldivian DMC",
      customer_name: "Arjun Singhania",
      lead_code: "JV-2026-102",
      destination: "Maldives Overwater Pool Villa",
      due_date: "2026-10-28T12:00:00Z",
      is_overdue: false,
      priority: "urgent",
      assigned_to: "Vikram Mehta",
      status: "completed",
    },
  ]);

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"urgent" | "high" | "medium">("high");

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t
      )
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCustomer) return;

    const newTask: AgendaTask = {
      id: `task-${Date.now()}`,
      title: newTitle,
      customer_name: newCustomer,
      due_date: newDueDate || new Date().toISOString(),
      is_overdue: false,
      priority: newPriority,
      assigned_to: "Neha Kapoor",
      status: "pending",
    };

    setTasks([newTask, ...tasks]);
    setIsModalOpen(false);
    setNewTitle("");
    setNewCustomer("");
    setNewDueDate("");
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "pending") return t.status === "pending";
    if (filter === "overdue") return t.status === "pending" && t.is_overdue;
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const overdueCount = tasks.filter((t) => t.status === "pending" && t.is_overdue).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tasks & Follow-up Agenda
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
              {pendingCount} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Client callback reminders, supplier confirmation deadlines, and quote follow-ups
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Tasks
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-slate-500">Across active holiday inquiries</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            Overdue Callbacks
          </p>
          <p className="text-2xl font-black text-rose-950 mt-1">{overdueCount}</p>
          <span className="text-[11px] text-rose-700">Immediate action required</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Completed Today
          </p>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {tasks.filter((t) => t.status === "completed").length}
          </p>
          <span className="text-[11px] text-emerald-700">All actions logged to audit trail</span>
        </div>
      </div>

      {/* ── FILTER & SEARCH ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or customer name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold w-full md:w-auto">
          {[
            { id: "all", label: "All Tasks" },
            { id: "pending", label: "Pending" },
            { id: "overdue", label: "Overdue Alerts" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                filter === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TASKS AGENDA LIST ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No tasks found matching your criteria.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = t.status === "completed";

            return (
              <div
                key={t.id}
                className={`p-4 transition flex items-start gap-4 ${
                  isCompleted
                    ? "bg-slate-50/60 opacity-60"
                    : t.is_overdue
                    ? "bg-rose-50/40"
                    : "hover:bg-slate-50/80"
                }`}
              >
                {/* Toggle checkbox */}
                <button
                  onClick={() => toggleTask(t.id)}
                  className="mt-0.5 text-slate-400 hover:text-teal-600 transition cursor-pointer shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-bold ${
                        isCompleted ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.priority === "urgent" && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{t.customer_name}</span>
                    {t.destination && <span>• {t.destination}</span>}
                    {t.lead_code && (
                      <span className="font-mono text-[11px] font-bold text-teal-700">
                        ({t.lead_code})
                      </span>
                    )}
                  </div>
                </div>

                {/* Due Date & Assignee */}
                <div className="text-right shrink-0 text-xs space-y-1">
                  <div className="flex items-center justify-end gap-1.5">
                    <Clock
                      className={`h-3.5 w-3.5 ${
                        t.is_overdue && !isCompleted ? "text-rose-600" : "text-slate-400"
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        t.is_overdue && !isCompleted
                          ? "text-rose-600 font-bold"
                          : "text-slate-600"
                      }`}
                    >
                      {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Owner: {t.assigned_to}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE TASK MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create Follow-up Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Confirm seaplane flight slots for client"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="e.g. Dr. Sameer Kulkarni"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
