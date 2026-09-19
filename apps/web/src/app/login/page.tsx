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
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));

        throw new Error(
          errData.message ||
            `Authentication failed with status ${res.status}`
        );
      }

      const data = await res.json();

      const userRole = (
        data.user?.role ||
        data.role ||
        "ADMIN"
      ).toUpperCase();

      const token =
        data.accessToken ||
        data.access_token ||
        data.token ||
        "";

      if (!token) {
        throw new Error("No authorization token returned by backend.");
      }

      const roleKey =
        userRole === "RECEPTIONIST" ? "RECEPTION" : userRole;

      const lowerKey = roleKey.toLowerCase();

      const activeSessionTokenKey = `${lowerKey}_active_token`;
      const activeSessionRoleKey = `${lowerKey}_active_role`;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userRole", userRole);
      sessionStorage.setItem(
        "userEmail",
        data.user?.email || cleanEmail
      );

      sessionStorage.setItem(activeSessionTokenKey, token);
      sessionStorage.setItem(activeSessionRoleKey, userRole);
      sessionStorage.setItem(`${lowerKey}_token`, token);
      sessionStorage.setItem(`${lowerKey}_role`, userRole);
      sessionStorage.setItem(
        `${lowerKey}_email`,
        data.user?.email || cleanEmail
      );
      sessionStorage.setItem(
        "session_started_at",
        Date.now().toString()
      );

      if (userRole === "DOCTOR") {
        queueToast("Login successful. Opening Doctor Panel.", "success");
        window.location.href = "/doctor/dashboard";
      } else if (
        userRole === "RECEPTION" ||
        userRole === "RECEPTIONIST"
      ) {
        queueToast("Login successful. Opening Reception Desk.", "success");
        window.location.href = "/reception/dashboard";
      } else {
        queueToast("Login successful. Opening Admin Dashboard.", "success");
        window.location.href = "/admin/dashboard";
      }
    } catch (err: any) {
      const message = err?.message || "Unable to authenticate.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (
    role: "ADMIN" | "DOCTOR" | "RECEPTION"
  ) => {
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
    <main className="min-h-screen w-full bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center p-0 sm:p-6 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-6xl min-h-screen sm:min-h-0 md:min-h-[680px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl sm:rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* Left Banner Section */}
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-slate-50 dark:bg-slate-900 p-10 lg:p-14 border-r border-slate-200/80 dark:border-slate-800">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[38px] border-slate-100 dark:border-slate-800/40"></div>
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-emerald-50/70 dark:bg-emerald-950/20"></div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-2xs">
                +
              </div>
              <div>
                <p className="text-base font-bold tracking-tight">DrBloo<span className="text-emerald-600 dark:text-emerald-400">Medi</span></p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Healthcare intelligence
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Connected care, one workspace
              </span>

              <h2 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl text-slate-900 dark:text-white">
                Better care starts with a clearer view.
              </h2>

              <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
                Coordinate clinical teams, patient journeys, and hospital operations from one calm, secure portal.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid max-w-md grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 shadow-2xs">
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">24/7</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Care visibility
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 shadow-2xs">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">Live</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Queue sync
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="flex flex-col justify-between bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-14">
          <div>
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-base font-bold text-white">
                +
              </div>
              <div>
                <p className="font-bold tracking-tight text-slate-900 dark:text-white text-sm">DrBlooMedi</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Staff portal
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Secure staff access
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome Back
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Let&apos;s get you logged in.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Email or username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400">✉</span>
                  <input
                    type="email"
                    required
                    placeholder="name@drbloomedi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 transition hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400">▣</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-14 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 transition hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-transparent cursor-pointer"
                />
                Remember me on this device
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In to Workspace →"}
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick test access
              </p>
             
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200 dark:border-slate-800 transition-all">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 font-bold">
                    <span className="text-sm">🏥</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                        Patient Self-Portal
                      </span>
                      <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                        Live
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Walk-in booking & live OPD tokens
                    </p>
                  </div>
                </div>

                <Link
                  href="/patient-portal"
                  className="inline-flex items-center space-x-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 cursor-pointer"
                >
                  <span>Open</span>
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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