"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api-client";
import { DashboardMetrics } from "../../lib/types";
import {
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Compass,
  Sparkles,
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  Target,
  Award,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      const data = await api.dashboard.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const stageDisplayNames: Record<string, string> = {
    new: "New Inquiries",
    assigned: "Assigned",
    contacted: "Contacted",
    qualified: "Qualified",
    proposal_sent: "Proposal Sent",
    negotiating: "Negotiating",
    won: "Confirmed Bookings",
    lost: "Closed / Lost",
  };

  const stageColors: Record<string, string> = {
    new: "bg-blue-500",
    assigned: "bg-indigo-500",
    contacted: "bg-purple-500",
    qualified: "bg-teal-500",
    proposal_sent: "bg-amber-500",
    negotiating: "bg-orange-500",
    won: "bg-emerald-500",
    lost: "bg-rose-500",
  };

  // Monthly Revenue Target simulation
  const monthlyTarget = 5000000; // ₹50 Lakhs
  const monthlyAchieved = 2850000; // ₹28.5 Lakhs
  const targetPct = Math.round((monthlyAchieved / monthlyTarget) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      {/* ── TOP BANNER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Executive Sales & Operations Desk
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              Q4 FY2026
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales velocity, lead response SLAs, and holiday booking pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isRefreshing ? "animate-spin text-teal-600" : "text-slate-400"
              }`}
            />
            <span>Refresh Live Data</span>
          </button>

          <Link
            href="/app/leads"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition"
          >
            <span>Open Pipeline Board</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── MONTHLY REVENUE & TARGET ACCELERATOR CARD ── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Target className="h-4 w-4" />
            <span>Monthly Booking Target</span>
          </div>
          <h2 className="text-2xl font-black">
            ₹{(monthlyAchieved / 100000).toFixed(1)} Lakhs{" "}
            <span className="text-slate-400 text-base font-normal">
              / ₹{(monthlyTarget / 100000).toFixed(0)} Lakhs Target
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            {targetPct}% achieved • 12 days remaining in October travel cycle
          </p>
        </div>

        <div className="w-full md:w-80 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400">Team Pace</span>
            <span className="text-teal-400">{targetPct}% on track</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${targetPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── KPI STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{metrics.total_leads}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>Omnichannel Volume</span>
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/90 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">New / Uncontacted</p>
            <p className="text-3xl font-black text-blue-950 mt-1">{metrics.new_leads}</p>
            <span className="inline-block text-[11px] font-semibold text-blue-700 mt-1">
              Avg SLA: &lt; 15 mins
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Zap className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Won Bookings</p>
            <p className="text-3xl font-black text-emerald-950 mt-1">{metrics.won_leads}</p>
            <span className="inline-block text-[11px] font-semibold text-emerald-700 mt-1">
              {metrics.conversion_rate}% conversion rate
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Overdue Tasks</p>
            <p className="text-3xl font-black text-amber-950 mt-1">{metrics.overdue_followups}</p>
            <span className="inline-block text-[11px] font-semibold text-amber-700 mt-1">
              {metrics.overdue_followups === 0 ? "Zero overdue follow-ups" : "Requires attention"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ── PIPELINE FUNNEL & URGENT ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pipeline Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Pipeline Stage Velocity
              </h2>
              <p className="text-xs text-slate-500">Active deal volume across the conversion funnel</p>
            </div>
            <Link
              href="/app/leads"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View Kanban</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {Object.entries(metrics.pipeline_by_stage).map(([stage, count]) => {
              if (stage === "junk") return null;
              const pct = metrics.total_leads > 0 ? Math.round((count / metrics.total_leads) * 100) : 0;
              const barColor = stageColors[stage] || "bg-slate-400";
              const label = stageDisplayNames[stage] || stage.toUpperCase();

              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{count}</span>
                      <span className="text-slate-400 text-[11px]">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Immediate Follow-ups & Hot Leads (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Priority Action Queue</span>
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Action Required
              </span>
            </div>

            <div className="space-y-3 pt-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-teal-700">JV-2026-104</span>
                  <span className="font-bold text-rose-700 text-[11px] bg-rose-50 px-2 py-0.2 rounded border border-rose-200">
                    Urgent Callback
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Kavita Deshmukh</p>
                  <p className="text-[11px] text-slate-500">Kashmir Honeymoon 6N • Pune (PNQ)</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="tel:+919920011223"
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href="https://wa.me/919920011223"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="h-3 w-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-teal-700">JV-2026-101</span>
                  <span className="font-bold text-amber-700 text-[11px] bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                    Follow-up Due
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Dr. Sameer Kulkarni</p>
                  <p className="text-[11px] text-slate-500">Switzerland Scenic Alps • Review quote options</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/app/leads/b64db9d6-ebbc-49dd-8c26-187ad96b9e17"
                    className="w-full py-1 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold text-center block"
                  >
                    Open Lead Workstation →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link
              href="/app/tasks"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              View Full Tasks Agenda ({metrics.overdue_followups + 2} pending) →
            </Link>
          </div>
        </div>
      </div>

      {/* ── CHANNEL PERFORMANCE & RECENT INTELLIGENCE ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Lead Ingestion Channels
          </h2>
          <div className="divide-y divide-slate-100">
            {Object.entries(metrics.leads_by_source).map(([src, count]) => (
              <div key={src} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 capitalize">
                  {src.replace(/_/g, " ")}
                </span>
                <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  {count} inquiries
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
              Destination Wiki Shortcuts
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Quick access to selling tips, visa requirements & luxury stays
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <Link
                href="/app/knowledge?dest=switzerland"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition flex items-center justify-between"
              >
                <span>Switzerland</span>
                <span className="text-[11px] text-teal-600 font-mono">CHF</span>
              </Link>
              <Link
                href="/app/knowledge?dest=dubai"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition flex items-center justify-between"
              >
                <span>Dubai Luxury</span>
                <span className="text-[11px] text-teal-600 font-mono">AED</span>
              </Link>
              <Link
                href="/app/knowledge?dest=maldives"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition flex items-center justify-between"
              >
                <span>Maldives</span>
                <span className="text-[11px] text-teal-600 font-mono">USD</span>
              </Link>
              <Link
                href="/app/knowledge?dest=kashmir"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition flex items-center justify-between"
              >
                <span>Kashmir Valley</span>
                <span className="text-[11px] text-teal-600 font-mono">INR</span>
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Link
              href="/app/knowledge"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>Explore all 19 destination wikis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
