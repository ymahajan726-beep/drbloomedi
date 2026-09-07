"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DashboardStats = {
  totalDoctors: number;
  totalPatients: number;
  totalReception: number;
  totalDepartments: number;
};

const API_URL = "http://localhost:4000";

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalReception: 0,
    totalDepartments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/dashboard/admin`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.replace("/login");
            return;
          }
          throw new Error("Failed to load dashboard statistics");
        }

        const data = await response.json();
        setStats({
          totalDoctors: data.totalDoctors || 0,
          totalPatients: data.totalPatients || 0,
          totalReception: data.totalReception || 0,
          totalDepartments: data.totalDepartments || 0,
        });
      } catch (error) {
        console.error("Dashboard loading failed:", error);
        setError(
          error instanceof Error ? error.message : "Unable to connect to backend",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.clear();
      document.cookie = "access_token=; path=/; max-age=0;";
      document.cookie = "user_role=; path=/; max-age=0;";
      router.replace("/login");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      {/* Top Bar Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              DrblooMedi Hospital Management System • Real-Time Database Metrics
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Primary Metric Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Card 1: Doctors */}
          <Link
            href="/admin/doctors"
            className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Specialists
                </p>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 text-xl group-hover:scale-110 transition">
                  🩺
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {loading ? "..." : stats.totalDoctors}
              </p>
            </div>
            <p className="mt-4 text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
              <span>Manage Doctors</span>
              <span>→</span>
            </p>
          </Link>

          {/* Card 2: Patients */}
          <Link
            href="/admin/patients"
            className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Patients
                </p>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-xl group-hover:scale-110 transition">
                  👥
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {loading ? "..." : stats.totalPatients}
              </p>
            </div>
            <p className="mt-4 text-xs text-emerald-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
              <span>Patients Directory</span>
              <span>→</span>
            </p>
          </Link>

          {/* Card 3: Reception Staff */}
          <Link
            href="/admin/reception"
            className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-purple-400 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Frontdesk Staff
                </p>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 text-xl group-hover:scale-110 transition">
                  🧑‍💼
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {loading ? "..." : stats.totalReception}
              </p>
            </div>
            <p className="mt-4 text-xs text-purple-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
              <span>Manage Staff</span>
              <span>→</span>
            </p>
          </Link>

          {/* Card 4: Departments */}
          <Link
            href="/admin/departments"
            className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Clinical Wings
                </p>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 text-xl group-hover:scale-110 transition">
                  🏢
                </span>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {loading ? "..." : stats.totalDepartments}
              </p>
            </div>
            <p className="mt-4 text-xs text-amber-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
              <span>View Departments</span>
              <span>→</span>
            </p>
          </Link>

          {/* Card 5: 📂 Medical Document Vault (NEW) */}
          <Link
            href="/admin/documents"
            className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  EMR Vault
                </p>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 text-xl group-hover:scale-110 transition">
                  📁
                </span>
              </div>
              <p className="mt-3 text-lg font-black text-slate-900 leading-tight">
                Document Vault
              </p>
              <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                Diagnostic scans, lab PDFs & EMR records
              </p>
            </div>
            <p className="mt-4 text-xs text-indigo-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
              <span>Open Repository</span>
              <span>→</span>
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}