"use client";

import React, { useState } from "react";
import Link from "next/link";
import { INITIAL_CUSTOMERS } from "../../../lib/mock-modules";
import { Customer } from "../../../lib/types";
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Award,
  Clock,
  Sparkles,
} from "lucide-react";

export default function CustomersPage() {
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const totalLTV = customers.reduce((acc, c) => acc + c.lifetime_value, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer 360 & Traveler Directory
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
              {customers.length} Verified Profiles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical holiday bookings, lifetime value, preferences, and direct WhatsApp touchpoints
          </p>
        </div>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Customer Lifetime Value
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ₹{(totalLTV / 100000).toFixed(2)} Lakhs
          </p>
          <span className="text-[11px] text-teal-700 font-semibold">Across {customers.length} registered high-value clients</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Repeat Traveler Rate
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">40.0%</p>
          <span className="text-[11px] text-slate-500">Clients booking multiple annual holidays</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Average Spend / Trip
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">₹7,30,000</p>
          <span className="text-[11px] text-slate-500">Luxury outbound ticket size</span>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, city, phone number, or preference tag (e.g. Honeymoon, Vegetarian, VIP)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* ── CUSTOMER CARDS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((c) => {
          const cleanPhone = c.phone.replace(/[^0-9]/g, "");
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
            c.name
          )},%20greetings%20from%20Jeto%20Vacations!`;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-sm flex items-center justify-center">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{c.name}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{c.city}, India</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                    ₹{(c.lifetime_value / 100000).toFixed(1)}L LTV
                  </span>
                </div>

                {/* Contact info */}
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{c.email}</span>
                  </p>
                </div>

                {/* Trip Stats */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Completed Trips</span>
                    <span className="font-bold text-slate-900">{c.completed_trips} Holidays</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Last Contact</span>
                    <span className="font-semibold text-slate-700">{c.last_interaction}</span>
                  </div>
                </div>

                {/* Preference Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`tel:${c.phone}`}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="h-3 w-3 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
