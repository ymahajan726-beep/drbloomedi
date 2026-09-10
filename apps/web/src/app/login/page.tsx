"use client";

import React, { useState } from "react";
import Link from "next/link";
import { queueToast, useToast } from "@/components/Toast";

const BACKEND_URL = "https://drbloomedi-backend.onrender.com";

export default function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const loginEndpoint = `${BACKEND_URL}/auth/login`;

      const res = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || `Authentication failed with status ${res.status}`
        );
      }

      const data = await res.json();
      const userRole = (data.user?.role || data.role || "ADMIN").toUpperCase();
      const token = data.accessToken || data.access_token || data.token || "";

      if (!token) {
        throw new Error("No authorization token returned by backend.");
      }

      const roleKey = userRole === "RECEPTIONIST" ? "RECEPTION" : userRole;
      const lowerKey = roleKey.toLowerCase();

      // 1. Save standard universal keys so server guards never trigger 307 redirect loops
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userEmail", data.user?.email || cleanEmail);

      // 2. Save role-specific keys for parallel tabs isolation
      localStorage.setItem(`${lowerKey}_token`, token);
      localStorage.setItem(`${lowerKey}_role`, userRole);
      localStorage.setItem(`${lowerKey}_email`, data.user?.email || cleanEmail);
      localStorage.setItem("session_started_at", Date.now().toString());

      // 3. Set universal cookies alongside role-specific ones
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const cookieConfig = `; path=/; max-age=86400; SameSite=Lax${isHttps ? "; Secure" : ""}`;
      
      document.cookie = `token=${token}${cookieConfig}`;
      document.cookie = `userRole=${userRole}${cookieConfig}`;
      document.cookie = `${lowerKey}_token=${token}${cookieConfig}`;
      document.cookie = `active_role=${userRole}${cookieConfig}`;

      // 4. Precise Workspace Routing
      if (userRole === "DOCTOR") {
        queueToast("Login successful. Opening Doctor Panel.", "success");
        window.location.href = "/doctor/dashboard";
      } else if (userRole === "RECEPTION" || userRole === "RECEPTIONIST") {
        queueToast("Login successful. Opening Reception Desk.", "success");
        window.location.href = "/reception/dashboard";
      } else {
        queueToast("Login successful. Opening Admin Dashboard.", "success");
        window.location.href = "/admin/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Unable to authenticate.");
      showToast(err.message || "Unable to authenticate.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (role: "ADMIN" | "DOCTOR" | "RECEPTION") => {
    if (role === "ADMIN") {
      setEmail("admin@drbloomedi.com");
      setPassword("Admin@1234");
    } else if (role === "DOCTOR") {
      setEmail("doctor@gmail.com");
      setPassword("11111111");
    } else {
      setEmail("rajesh@gmail.com");
      setPassword("22222222");
    }
    setError("");
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-0 sm:p-6 font-sans">

      <div className="w-full max-w-6xl min-h-screen sm:min-h-0 md:min-h-[680px] bg-white border border-slate-200 shadow-xl sm:rounded-[2rem] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-sky-50 p-10 lg:p-14 text-slate-900">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[38px] border-white/80"></div>
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-emerald-100/70"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-600/20">+</div>
              <div>
                <p className="text-lg font-black tracking-tight">DrBlooMedi</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">Healthcare intelligence</p>
              </div>
            </div>
            <div className="max-w-md space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Connected care, one workspace
            </span>
            <h2 className="text-4xl font-black leading-tight tracking-tight lg:text-5xl">
              Better care starts with a clearer view.
            </h2>
            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Coordinate clinical teams, patient journeys, and hospital operations from one calm, secure portal.
            </p>
            </div>
          </div>

          <div className="relative z-10 grid max-w-md grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
              <p className="text-2xl font-black text-slate-900">24/7</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Care visibility</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
              <p className="text-2xl font-black text-emerald-600">Live</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Queue sync</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between bg-white p-6 text-slate-900 sm:p-10 lg:p-14">
          <div>
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-black text-white">
                +
              </div>
              <div>
                <p className="font-black tracking-tight text-slate-900">DrBlooMedi</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700">Staff portal</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Secure staff access</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Welcome Back</h1>
              <p className="mt-2 text-sm text-slate-500">Let&apos;s get you logged in.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 text-xs">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-600">Email or username</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400">✉</span>
                  <input
                    type="email"
                    required
                    placeholder="name@drbloomedi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Password</label>
                  <Link href="/forgot-password" className="text-[11px] font-bold text-blue-600 transition hover:text-blue-800">Need Help?</Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400">▣</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-16 font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[11px] font-bold text-slate-500 transition hover:text-slate-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Remember me on this device
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Sign In to Workspace →"}
              </button>
            </form>
          </div>

          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick test access
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofill("ADMIN")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill("DOCTOR")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  🩺 Doctor
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill("RECEPTION")}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  🧑‍💼 Reception
                </button>
              </div>
            </div>

            {/* Modern Patient Self-Portal Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-[1px] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 opacity-30 group-hover:opacity-75 transition-opacity" />
              
              <div className="relative flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3.5 backdrop-blur-md">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
                    <span className="text-lg">🏥</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white tracking-wide">Patient Self-Portal</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">Live</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Walk-in booking & live OPD tokens</p>
                  </div>
                </div>
                
                <Link 
                  href="/patient-portal" 
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:scale-95"
                >
                  <span>Open</span>
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}