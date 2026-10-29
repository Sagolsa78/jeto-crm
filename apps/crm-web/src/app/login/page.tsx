"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Shield, Plane, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Plane className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white">JETO VACATIONS</h1>
            <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase">Travel CRM & Operations</p>
          </div>
        </div>
        <h2 className="text-center text-sm text-slate-400">
          Sign in to manage outbound holiday leads, proposals & bookings
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Work Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@jetovacations.com"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to CRM Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              One-Click RBAC Demo Roles
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("admin@jetovacations.com", "Admin@Jeto2026!")}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <span className="font-semibold text-slate-200">Aditya Verma (Admin)</span>
                  <p className="text-slate-400 text-xs">admin@jetovacations.com</p>
                </div>
                <span className="text-xs font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded">
                  Executive (Global)
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("pooja.sharma@jetovacations.com", "Pooja@Jeto2026!")}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <span className="font-semibold text-slate-200">Pooja Sharma (Sales Desk Manager)</span>
                  <p className="text-slate-400 text-xs">pooja.sharma@jetovacations.com</p>
                </div>
                <span className="text-xs font-mono uppercase bg-purple-950/80 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded">
                  Manager (Team)
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("neha.kapoor@jetovacations.com", "Neha@Jeto2026!")}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <span className="font-semibold text-slate-200">Neha Kapoor (Senior Consultant)</span>
                  <p className="text-slate-400 text-xs">neha.kapoor@jetovacations.com</p>
                </div>
                <span className="text-xs font-mono uppercase bg-teal-950/80 text-teal-300 border border-teal-800/50 px-2 py-0.5 rounded">
                  Consultant (Assigned)
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("vikram.mehta@jetovacations.com", "Vikram@Jeto2026!")}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <span className="font-semibold text-slate-200">Vikram Mehta (Operations Manager)</span>
                  <p className="text-slate-400 text-xs">vikram.mehta@jetovacations.com</p>
                </div>
                <span className="text-xs font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded">
                  Operations (Fulfillment)
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5 text-teal-500" />
            <span>FastAPI JWT Auth • Role Enforced • Zero Unverified Endpoints</span>
          </div>
        </div>
      </div>
    </div>
  );
}
