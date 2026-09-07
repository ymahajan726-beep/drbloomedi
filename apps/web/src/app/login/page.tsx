"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
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
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Invalid credentials. Please verify.");
      }

      const data = await res.json();
      const userRole = (data.user?.role || data.role || "ADMIN").toUpperCase();
      const token = data.access_token || data.token || "";

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userEmail", data.user?.email || email);

      document.cookie = `token=${token}; path=/; max-age=86400;`;
      document.cookie = `userRole=${userRole}; path=/; max-age=86400;`;

      if (userRole === "DOCTOR") {
        router.push("/doctor/dashboard");
      } else if (userRole === "RECEPTION") {
        router.push("/reception/dashboard");
      } else {
        router.push("/admin/dashboard");
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
    <main className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Visual Hero Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wider">
              v2.4 Security Active
            </span>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Healthcare Management Reimagined.
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed font-medium">
              Centralized hospital orchestration for clinical OPD, counter billing, patient telemetry, and doctor workflows.
            </p>
          </div>

          <div className="space-y-4 relative z-10 pt-8">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-blue-200">Live System Telemetry</span>
                <span className="text-emerald-300">99.9% Uptime</span>
              </div>
              <div className="h-8 flex items-center">
                <svg className="w-full h-6 stroke-emerald-300 fill-none stroke-2" viewBox="0 0 100 25">
                  <path d="M0 12 L20 12 L30 3 L40 22 L50 8 L60 16 L70 12 L100 12" />
                </svg>
              </div>
            </div>
            <p className="text-[10px] text-blue-200 text-center font-medium">
              🔒 256-Bit SSL Encrypted Healthcare Portal
            </p>
          </div>
        </div>

        {/* Right Form Suite */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                +
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  <span className="text-blue-600">DrBloo</span>Medi
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  Enter your credentials to access your designated workspace
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">✉️</span>
                  <input
                    type="email"
                    required
                    placeholder="admin@drbloomedi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 outline-none focus:border-blue-600 text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[11px] font-bold text-blue-600 hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">🔑</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-14 py-2.5 outline-none focus:border-blue-600 text-slate-800 font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-[11px] text-slate-400 hover:text-slate-700 font-bold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {loading ? "Authenticating Account..." : "Sign In to Portal →"}
              </button>
            </form>
          </div>

          {/* Quick Access Footbar (Balanced & Clean) */}
          <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Test Autofill:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofill("ADMIN")}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill("DOCTOR")}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition"
                >
                  🩺 Doctor
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill("RECEPTION")}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition"
                >
                  🧑‍💼 Reception
                </button>
              </div>
            </div>

            {/* Compact Horizontal Patient Portal Strip */}
            <Link
              href="/patient-portal"
              className="flex items-center justify-between p-2.5 bg-blue-50/70 hover:bg-blue-100/60 border border-blue-200/80 rounded-xl transition group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🧑‍⚕️</span>
                <div>
                  <p className="text-xs font-bold text-blue-900 leading-tight">Patient Portal Access</p>
                  <p className="text-[10px] text-blue-600 font-medium">Book appointments & check token status</p>
                </div>
              </div>
              <span className="text-xs text-blue-700 font-bold group-hover:translate-x-0.5 transition">
                Open →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}