"use client";

import React, { useState } from "react";
import Link from "next/link";

const BACKEND_URL = "https://drbloomedi-backend.onrender.com";

export default function LoginPage() {
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

      localStorage.clear();
      sessionStorage.clear();

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userEmail", data.user?.email || cleanEmail);
      localStorage.setItem("session_started_at", Date.now().toString());

      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const cookieConfig = `; path=/; max-age=86400; SameSite=Lax${isHttps ? "; Secure" : ""}`;

      document.cookie = `token=${token}${cookieConfig}`;
      document.cookie = `userRole=${userRole}${cookieConfig}`;

      if (userRole === "DOCTOR") {
        window.location.href = "/doctor/dashboard";
      } else if (userRole === "RECEPTION" || userRole === "RECEPTIONIST") {
        window.location.href = "/reception/dashboard";
      } else {
        window.location.href = "/admin/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Unable to authenticate.");
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
    <main className="min-h-screen w-full bg-[#070b19] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Floating Glass Container */}
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] max-w-4xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] relative z-10">
        
        {/* Left Style Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wider border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure Enterprise Cloud
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              DrBlooMedi <br />
              <span className="text-blue-200">Intelligence.</span>
            </h2>
            <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
              Next-generation clinical automation, real-time patient queue telemetry, and automated financial settlements.
            </p>
          </div>

          <div className="space-y-4 relative z-10 pt-8">
            <div className="p-4 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-300">Active Node Status</span>
                <span className="text-emerald-400 font-mono">ONLINE</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full w-[99.9%] animate-pulse"></div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center font-medium">
              ⚡ Powered by Neon DB & Live WebSockets
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-slate-900/40 text-slate-100">
          <div>
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                +
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Staff <span className="text-blue-400">Portal</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  Sign in with your authorized credentials
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-semibold flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500">✉️</span>
                  <input
                    type="email"
                    required
                    placeholder="Enter your mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 outline-none focus:border-blue-500 text-white font-medium transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500">🔑</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-14 py-3 outline-none focus:border-blue-500 text-white font-medium transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[11px] text-slate-400 hover:text-white font-bold transition"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Sign In to Workspace →"}
              </button>
            </form>
          </div>

          {/* Footer Quick Tools */}
          <div className="pt-6 border-t border-slate-800/80 mt-6 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Test Autofill:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofill("ADMIN")}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-[11px] font-bold text-slate-300 transition"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill("DOCTOR")}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-[11px] font-bold text-slate-300 transition"
                >
                  🩺 Doctor
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill("RECEPTION")}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-[11px] font-bold text-slate-300 transition"
                >
                  🧑‍💼 Reception
                </button>
              </div>
            </div>

            {/* Patient Portal Link Card */}
            <Link
              href="/patient-portal"
              className="flex items-center justify-between p-3 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/40 rounded-xl transition group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🧑‍⚕️</span>
                <div>
                  <p className="text-xs font-bold text-blue-200 leading-tight">Patient Self-Portal</p>
                  <p className="text-[10px] text-blue-400 font-medium">Walk-in booking & live OPD tokens</p>
                </div>
              </div>
              <span className="text-xs text-blue-300 font-bold group-hover:translate-x-0.5 transition">
                Open →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}