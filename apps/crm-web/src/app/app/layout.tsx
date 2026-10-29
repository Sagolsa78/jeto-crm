"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Compass,
  CheckSquare,
  LogOut,
  Plane,
  Shield,
  Search,
  Bell,
  Sparkles,
  FileText,
  BookOpen,
  Plus,
  Command,
  ChevronDown,
  Phone,
  MessageCircle,
  X,
  ExternalLink,
  Briefcase,
  Layers,
} from "lucide-react";
import { DESTINATION_GUIDES, INITIAL_QUOTES, INITIAL_CUSTOMERS } from "../../lib/mock-modules";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Command palette state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTeam, setActiveTeam] = useState("Outbound Luxury Desk");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Keyboard shortcut listener for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandOpen(false);
        setIsQuickMenuOpen(false);
        setIsNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm text-slate-400 font-medium">Connecting to Jeto CRM Desk...</p>
        </div>
      </div>
    );
  }

  const navSections = [
    {
      title: "Core Pipeline",
      items: [
        { label: "Dashboard", href: "/app", icon: LayoutDashboard },
        { label: "Leads Pipeline", href: "/app/leads", icon: Users, badge: "Live" },
        { label: "Quotations & CPQ", href: "/app/quotes", icon: FileText },
        { label: "Customer 360", href: "/app/customers", icon: Briefcase },
      ],
    },
    {
      title: "Intelligence & Ops",
      items: [
        { label: "Destination Wiki", href: "/app/knowledge", icon: BookOpen, badge: "19 Guides" },
        { label: "Tasks & Agenda", href: "/app/tasks", icon: CheckSquare },
      ],
    },
  ];

  // Filtered command palette items
  const q = commandQuery.toLowerCase().trim();
  const filteredDestinations = DESTINATION_GUIDES.filter(
    (d) => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
  );
  const filteredCustomers = INITIAL_CUSTOMERS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
        <div className="flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
            <Link href="/app" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition">
                <Plane className="h-5 w-5 text-slate-950 font-bold" />
              </div>
              <div>
                <span className="font-black text-sm tracking-wider text-white">JETO VACATIONS</span>
                <span className="block text-[11px] uppercase font-bold tracking-widest text-teal-400">
                  TRAVEL CRM
                </span>
              </div>
            </Link>
          </div>

          {/* Team Switcher */}
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Active Desk Team
            </label>
            <div className="relative">
              <select
                value={activeTeam}
                onChange={(e) => setActiveTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="Outbound Luxury Desk">Outbound Luxury Desk</option>
                <option value="Domestic & Honeymoon">Domestic & Honeymoon</option>
                <option value="VIP Corporate & Charters">VIP Corporate & Charters</option>
              </select>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="p-4 space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <p className="px-3 text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  {section.title}
                </p>
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/app"
                        ? pathname === "/app"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 ${isActive ? "text-teal-400" : "text-slate-500"}`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                              isActive
                                ? "bg-teal-400 text-slate-950"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center">
                  {user.full_name.charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">{user.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      user.role === "admin"
                        ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                        : user.role === "manager"
                        ? "bg-purple-950/80 text-purple-300 border border-purple-800/50"
                        : user.role === "operations"
                        ? "bg-blue-950/80 text-blue-300 border border-blue-800/50"
                        : "bg-teal-950/80 text-teal-300 border border-teal-800/50"
                    }`}
                  >
                    {user.role === "admin"
                      ? "Executive Admin"
                      : user.role === "manager"
                      ? "Sales Desk Manager"
                      : user.role === "operations"
                      ? "Operations Specialist"
                      : "Travel Consultant"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0 shadow-xs z-20">
          {/* Quick Search & Command Palette Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 transition cursor-pointer group shadow-2xs w-72"
            >
              <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 transition" />
              <span className="flex-1 text-left">Quick Search CRM...</span>
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-400 shadow-xs">
                ⌘K
              </kbd>
            </button>

            <span
              className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                user.role === "admin"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : user.role === "manager"
                  ? "bg-purple-50 text-purple-800 border-purple-200"
                  : user.role === "operations"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-teal-50 text-teal-800 border-teal-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  user.role === "admin"
                    ? "bg-amber-500"
                    : user.role === "manager"
                    ? "bg-purple-500"
                    : user.role === "operations"
                    ? "bg-blue-500"
                    : "bg-teal-500"
                } animate-pulse`}
              />
              {user.role === "admin"
                ? "Global Scope: All Desks"
                : user.role === "manager"
                ? "Team Scope: Outbound Luxury"
                : user.role === "operations"
                ? "Ops Scope: Post-Booking Won"
                : "Assigned Scope: Personal + Inbound Pool"}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Quick Action Button */}
            <div className="relative">
              <button
                onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>

              {isQuickMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs z-50">
                  <Link
                    href="/app/leads"
                    onClick={() => setIsQuickMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    <span>New Lead Inquiry</span>
                  </Link>
                  <Link
                    href="/app/quotes"
                    onClick={() => setIsQuickMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Generate Quotation</span>
                  </Link>
                  <Link
                    href="/app/tasks"
                    onClick={() => setIsQuickMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
                    <span>Schedule Task</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-xs z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="font-bold text-slate-900">Notifications & Alerts</span>
                    <span className="text-[11px] text-teal-600 font-semibold">2 New</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900">
                      <p className="font-bold">New Web Callback Inquiry</p>
                      <p className="text-slate-600 text-[11px]">Kavita Deshmukh requested callback for Kashmir 6N.</p>
                      <span className="text-[10px] text-slate-400">10 mins ago</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-900">
                      <p className="font-bold">Follow-up Task Due Today</p>
                      <p className="text-slate-600 text-[11px]">Review Alpine Explorer proposal with Dr. Sameer.</p>
                      <span className="text-[10px] text-slate-400">Due at 4:00 PM</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            {/* User Pill */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-slate-800">{user.full_name}</span>
                <span className="block text-[11px] text-slate-400">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>

      {/* Global Command Palette Modal (⌘K) */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 border-b border-slate-100 flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
              <input
                autoFocus
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Jump to destination wiki, client, lead, or quotation..."
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
              {/* Quick Navigation */}
              <div>
                <p className="text-[11px] uppercase font-bold text-slate-400 px-2 mb-1">
                  Navigation
                </p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      router.push("/app");
                      setIsCommandOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-teal-600" />
                    <span>Executive Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push("/app/leads");
                      setIsCommandOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    <span>Leads & Inquiries Pipeline</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push("/app/quotes");
                      setIsCommandOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Quotations & Itinerary Proposals</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push("/app/knowledge");
                      setIsCommandOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                    <span>Destination Knowledge Wiki</span>
                  </button>
                </div>
              </div>

              {/* Destination Wiki Matches */}
              {filteredDestinations.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400 px-2 mb-1">
                    Destination Guides ({filteredDestinations.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredDestinations.slice(0, 4).map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => {
                          router.push(`/app/knowledge?dest=${dest.slug}`);
                          setIsCommandOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-teal-50 text-slate-800 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Compass className="h-3.5 w-3.5 text-teal-600" />
                          <span className="font-semibold">{dest.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 group-hover:text-teal-700">
                          {dest.ideal_duration}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Matches */}
              {filteredCustomers.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase font-bold text-slate-400 px-2 mb-1">
                    Customers ({filteredCustomers.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredCustomers.slice(0, 3).map((cust) => (
                      <button
                        key={cust.id}
                        onClick={() => {
                          router.push("/app/customers");
                          setIsCommandOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          <span className="font-semibold">{cust.name}</span>
                          <span className="text-slate-400 text-[11px]">({cust.city})</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-teal-700">
                          ₹{(cust.lifetime_value / 100000).toFixed(1)}L LTV
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Press ESC to exit</span>
              <span>Jeto CRM Universal Search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
