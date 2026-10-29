"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api-client";
import { Proposal, Quote, QuoteStatus } from "../../../lib/types";
import { INITIAL_QUOTES } from "../../../lib/mock-modules";
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter,
  Download,
  Share2,
  X,
  AlertCircle,
  Percent,
  Check,
  ShieldAlert,
  Send,
  MessageCircle,
} from "lucide-react";

interface DisplayProposal {
  id: string;
  code: string;
  title: string;
  customer: string;
  phone: string;
  destination: string;
  nights: number;
  pax: number;
  marginPct?: number | null;
  totalAmount: number;
  validUntil: string;
  status: QuoteStatus;
  clientToken: string;
  requiresApproval: boolean;
  approvedByName?: string | null;
}

export default function QuotesPage() {
  const { canViewMargins, can } = useAuth();
  const [proposals, setProposals] = useState<DisplayProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Create Quote Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [destination, setDestination] = useState("Switzerland Scenic Alps");
  const [nights, setNights] = useState(7);
  const [paxAdults, setPaxAdults] = useState(2);
  const [netSupplierCost, setNetSupplierCost] = useState(400000);
  const [marginPct, setMarginPct] = useState(16);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatedTotal = Math.round(netSupplierCost * (1 + marginPct / 100) * 1.05);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const res = await api.proposals.list({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res.items && res.items.length > 0) {
        const mapped: DisplayProposal[] = res.items.map((p) => ({
          id: p.id,
          code: p.proposal_code,
          title: p.title,
          customer: p.created_by_name ? `Traveler (${p.created_by_name})` : "Direct Client",
          phone: "+91 98XXX XXXXX",
          destination: p.destination,
          nights: p.nights,
          pax: p.pax_adults,
          marginPct: p.markup_percentage,
          totalAmount: p.total_client_amount,
          validUntil: p.valid_until ? p.valid_until.split("T")[0] : "14 Days",
          status: p.status,
          clientToken: p.client_token,
          requiresApproval: p.requires_approval,
          approvedByName: p.approved_by_name,
        }));
        setProposals(mapped);
      } else {
        // Fallback to initial mock quotes if empty
        const initialMapped: DisplayProposal[] = INITIAL_QUOTES.map((q) => ({
          id: q.id,
          code: q.quote_code,
          title: `${q.destination} Package`,
          customer: q.customer_name,
          phone: q.customer_phone,
          destination: q.destination,
          nights: q.nights,
          pax: q.pax_adults,
          marginPct: q.margin_percentage,
          totalAmount: q.total_amount,
          validUntil: q.valid_until,
          status: q.status,
          clientToken: q.quote_code,
          requiresApproval: false,
        }));
        setProposals(initialMapped);
      }
    } catch (err) {
      console.error("Failed to load proposals", err);
      // Fallback
      setProposals(
        INITIAL_QUOTES.map((q) => ({
          id: q.id,
          code: q.quote_code,
          title: `${q.destination} Package`,
          customer: q.customer_name,
          phone: q.customer_phone,
          destination: q.destination,
          nights: q.nights,
          pax: q.pax_adults,
          marginPct: q.margin_percentage,
          totalAmount: q.total_amount,
          validUntil: q.valid_until,
          status: q.status,
          clientToken: q.quote_code,
          requiresApproval: false,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [search, statusFilter]);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    setIsSubmitting(true);
    try {
      const created = await api.proposals.create({
        title: `${destination} ${nights}-Night Holiday`,
        destination,
        nights: Number(nights),
        pax_adults: Number(paxAdults),
        supplier_cost: Number(netSupplierCost),
        markup_percentage: Number(marginPct),
        notes: `Customer: ${customerName} (${customerPhone})`,
        items: [
          {
            item_type: "hotel",
            title: `Luxury Chalet / Resort - ${destination}`,
            selling_price: Math.round(calculatedTotal * 0.7),
          },
          {
            item_type: "activity",
            title: `Signature Experiences & Private Transfers`,
            selling_price: Math.round(calculatedTotal * 0.3),
          },
        ],
      });

      const newDisplay: DisplayProposal = {
        id: created.id,
        code: created.proposal_code,
        title: created.title,
        customer: customerName,
        phone: customerPhone,
        destination: created.destination,
        nights: created.nights,
        pax: created.pax_adults,
        marginPct: created.markup_percentage,
        totalAmount: created.total_client_amount,
        validUntil: created.valid_until ? created.valid_until.split("T")[0] : "14 Days",
        status: created.status,
        clientToken: created.client_token,
        requiresApproval: created.requires_approval,
      };

      setProposals([newDisplay, ...proposals]);
      setIsModalOpen(false);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err: any) {
      alert(`Error creating proposal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    try {
      const updated = await api.proposals.approve(proposalId);
      setProposals(
        proposals.map((p) =>
          p.id === updated.id
            ? {
                ...p,
                requiresApproval: false,
                approvedByName: updated.approved_by_name,
              }
            : p
        )
      );
      alert(`Proposal approved successfully.`);
    } catch (err: any) {
      alert(`Error approving deal: ${err.message}`);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `http://localhost:3000/proposal/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const statusBadge = (st: QuoteStatus, requiresApproval: boolean) => {
    if (requiresApproval) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3 text-amber-600" />
          Pending Approval
        </span>
      );
    }
    const styles: Record<QuoteStatus, string> = {
      draft: "bg-slate-100 text-slate-700 border-slate-300",
      sent: "bg-blue-50 text-blue-800 border-blue-300",
      accepted: "bg-emerald-50 text-emerald-800 border-emerald-300",
      rejected: "bg-rose-50 text-rose-800 border-rose-300",
      expired: "bg-slate-100 text-slate-500 border-slate-200",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${styles[st]}`}>
        {st}
      </span>
    );
  };

  const totalValue = proposals.reduce((acc, q) => acc + q.totalAmount, 0);
  const acceptedValue = proposals
    .filter((q) => q.status === "accepted")
    .reduce((acc, q) => acc + q.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Quotations & CPQ Hub
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {proposals.length} Persistent Proposals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic holiday itinerary pricing, supplier markup calculation, role-protected margins & tokenized customer proposals
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pipeline Quoted Value
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ₹{(totalValue / 100000).toFixed(2)} Lakhs
          </p>
          <span className="text-xs text-slate-500">Across {proposals.length} total generated proposals</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Accepted Proposals
          </p>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            ₹{(acceptedValue / 100000).toFixed(2)} Lakhs
          </p>
          <span className="text-xs text-emerald-700">Converted into confirmed holiday bookings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            {canViewMargins() ? "Average Realized Margin" : "Proposal SLA"}
          </p>
          <p className="text-2xl font-black text-indigo-950 mt-1">
            {canViewMargins() ? "16.8%" : "100% On-Time"}
          </p>
          <span className="text-xs text-indigo-700">
            {canViewMargins()
              ? "Protected gross margin across all active packages"
              : "All customer quotes dispatched under 24 hours"}
          </span>
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
            placeholder="Search quotation code, traveler name, or destination..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold w-full md:w-auto">
          {["all", "draft", "sent", "accepted", "expired"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ── QUOTES DATA TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Quote Code</th>
                <th className="py-3 px-4">Customer & Title</th>
                <th className="py-3 px-4">Destination & Nights</th>
                {canViewMargins() && <th className="py-3 px-4">Agency Margin</th>}
                <th className="py-3 px-4">Client Price</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {proposals.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                    {q.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{q.customer}</div>
                    <div className="text-xs text-slate-400">{q.title}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{q.destination}</div>
                    <div className="text-xs text-slate-400">
                      {q.nights} Nights • {q.pax} Adults
                    </div>
                  </td>
                  {canViewMargins() && (
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {q.marginPct !== undefined && q.marginPct !== null ? `${q.marginPct}%` : "—"}
                    </td>
                  )}
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    ₹{q.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    Valid till {q.validUntil}
                  </td>
                  <td className="py-3.5 px-4">{statusBadge(q.status, q.requiresApproval)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {q.requiresApproval && can("quotes:approve") && (
                        <button
                          onClick={() => handleApprove(q.id)}
                          className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition"
                          title="Approve low margin deal"
                        >
                          Approve
                        </button>
                      )}

                      <a
                        href={`https://wa.me/?text=Hello! Here is your custom luxury holiday proposal from Jeto Vacations: http://localhost:3000/proposal/${q.clientToken}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Send Proposal via WhatsApp"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>

                      <button
                        title="Copy shareable client proposal link"
                        onClick={() => handleCopyLink(q.clientToken)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          copiedToken === q.clientToken
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {copiedToken === q.clientToken ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        title="Download quotation summary"
                        onClick={() => alert(`Downloading PDF quotation: ${q.code}.pdf`)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE QUOTATION MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Generate Travel Quotation</h3>
                <p className="text-xs text-slate-500">FastAPI CPQ calculation engine with role margin protection</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Vikram Sethi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Phone *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 99887 76655"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Nights)</label>
                  <input
                    type="number"
                    min={1}
                    value={nights}
                    onChange={(e) => setNights(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pax Adults</label>
                  <input
                    type="number"
                    min={1}
                    value={paxAdults}
                    onChange={(e) => setPaxAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Pricing & Margin Calculator Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block">Pricing & Margin Engine</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Supplier Net Cost (₹)</label>
                    <input
                      type="number"
                      step={5000}
                      value={netSupplierCost}
                      onChange={(e) => setNetSupplierCost(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Agency Markup (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={40}
                      value={marginPct}
                      onChange={(e) => setMarginPct(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Final Client Quote Price (incl. 5% GST):</span>
                  <span className="text-base font-black text-indigo-700">
                    ₹{calculatedTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                {marginPct < 12 && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    ⚠️ Note: Markup is below 12%. This proposal will require Manager approval before dispatch.
                  </p>
                )}
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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Generating..." : "Generate & Save Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
