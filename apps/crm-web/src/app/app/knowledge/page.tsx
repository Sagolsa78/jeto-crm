"use client";

import React, { useState } from "react";
import { DESTINATION_GUIDES } from "../../../lib/mock-modules";
import { DestinationGuide } from "../../../lib/types";
import {
  BookOpen,
  Search,
  MapPin,
  Calendar,
  Clock,
  Compass,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Building,
} from "lucide-react";

export default function KnowledgePage() {
  const [guides] = useState<DestinationGuide[]>(DESTINATION_GUIDES);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [activeGuide, setActiveGuide] = useState<DestinationGuide | null>(null);

  const regions = [
    "All",
    "Europe",
    "Middle East",
    "Southeast Asia",
    "Domestic India",
    "Island Retreats",
  ];

  const filteredGuides = guides.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.country.toLowerCase().includes(search.toLowerCase()) ||
      g.consultant_selling_tips.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = selectedRegion === "All" || g.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Destination Knowledge Base & Consultant Wiki
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {guides.length} Curated Desks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official sales intelligence, visa timelines, luxury resorts, and client pitching advice
          </p>
        </div>
      </div>

      {/* ── FILTER & REGION PILLS ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destination, visa requirements, luxury stays, or consultant advice..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pt-1 border-t border-slate-100">
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                selectedRegion === reg
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* ── DESTINATION CARDS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuides.map((guide) => (
          <div
            key={guide.id}
            onClick={() => setActiveGuide(guide)}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition p-5 space-y-4 cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {guide.region}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {guide.ideal_duration}
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-800 transition">
                  {guide.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>{guide.country}</span>
                </p>
              </div>

              {/* Key Specs */}
              <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Best Season:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">
                    {guide.best_months.split("|")[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Visa Timeline:</span>
                  <span className="font-semibold text-teal-700">{guide.visa_processing_days}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Avg Cost / Couple:</span>
                  <span className="font-extrabold text-slate-900">{guide.avg_cost_per_couple}</span>
                </div>
              </div>

              {/* Top Stays */}
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Signature Luxury Stays
                </span>
                <ul className="text-xs text-slate-700 space-y-1">
                  {guide.luxury_stays.slice(0, 2).map((stay, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 truncate">
                      <Building className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="truncate">{stay}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Consultant Insider Note</span>
              <div className="flex items-center gap-1 font-bold text-amber-700 group-hover:translate-x-0.5 transition">
                <span>View Full Wiki</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESTINATION DETAILS SLIDE-OVER DRAWER ── */}
      {activeGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                  {activeGuide.region}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {activeGuide.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveGuide(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Consultant Selling Tip Card */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>Consultant Selling & Conversion Strategy</span>
                </span>
                <p className="text-amber-950 leading-relaxed italic">
                  "{activeGuide.consultant_selling_tips}"
                </p>
              </div>

              {/* Key Logistics */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Logistics & Client Planning
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-slate-400 block mb-0.5 font-medium">Ideal Duration</span>
                    <span className="font-bold text-slate-900">{activeGuide.ideal_duration}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-slate-400 block mb-0.5 font-medium">Visa Turnaround</span>
                    <span className="font-bold text-teal-800">{activeGuide.visa_processing_days}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-slate-400 block mb-0.5 font-medium">Currency & FX</span>
                    <span className="font-bold text-slate-900">{activeGuide.currency}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-slate-400 block mb-0.5 font-medium">Local Timezone</span>
                    <span className="font-bold text-slate-900">{activeGuide.time_zone}</span>
                  </div>
                </div>
              </div>

              {/* Best Seasons */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-1.5">
                  Best Weather Window
                </h4>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {activeGuide.best_months}
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Must-Include Client Experiences
                </h4>
                <div className="space-y-1.5">
                  {activeGuide.key_highlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span className="font-medium text-slate-800">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Luxury Resorts */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Recommended 5-Star Properties
                </h4>
                <div className="space-y-1.5">
                  {activeGuide.luxury_stays.map((stay, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-2"
                    >
                      <Building className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{stay}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveGuide(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Wiki
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
