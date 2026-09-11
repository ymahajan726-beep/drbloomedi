'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DashboardStats = {
  totalDoctors: number;
  totalPatients: number;
  totalReception: number;
  totalDepartments: number;
  grossRevenue: number;
  completedConsultations: number;
  waitingQueue: number;
};

const API_URL = "https://drbloomedi-backend.onrender.com";

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalReception: 0,
    totalDepartments: 4,
    grossRevenue: 0,
    completedConsultations: 0,
    waitingQueue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        // Multi-login safe: Admin-specific token retrieval
        const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || localStorage.getItem("token") : null;
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const [dashRes, aptRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/admin`, { headers, credentials: "include" }).catch(() => null),
          fetch(`${API_URL}/appointments`, { headers, credentials: "include" }).catch(() => null),
        ]);

        let docCount = 0, patCount = 0, recCount = 0, deptCount = 4;
        if (dashRes && dashRes.ok) {
          const dashData = await dashRes.json();
          docCount = dashData.totalDoctors || 0;
          patCount = dashData.totalPatients || 0;
          recCount = dashData.totalReception || 0;
          deptCount = dashData.totalDepartments || 4;
        }

        let waiting = 0;
        let completed = 0;
        let revenue = 0;

        if (aptRes && aptRes.ok) {
          const aptList = await aptRes.json();
          if (Array.isArray(aptList)) {
            aptList.forEach((apt: any) => {
              const isDone =
                apt.status === "Completed" ||
                apt.status === "COMPLETED" ||
                apt.paymentStatus === "PAID" ||
                apt.isPaid === true;

              if (isDone) {
                completed++;
                revenue += Number(apt.doctor?.consultationFee) || 500;
              } else {
                waiting++;
              }
            });

            if (patCount === 0) {
              patCount = aptList.length;
            }
          }
        }

        try {
          const ledger = localStorage.getItem("drbloomedi_paid_appointments_v2");
          if (ledger) {
            const parsed = JSON.parse(ledger);
            let ledgerRev = 0;
            Object.values(parsed).forEach((p: any) => {
              if (p?.isPaid) ledgerRev += Number(p?.amount || 500);
            });
            if (ledgerRev > revenue) {
              revenue = ledgerRev;
            }
          }
        } catch {}

        setStats({
          totalDoctors: docCount,
          totalPatients: patCount,
          totalReception: recCount,
          totalDepartments: deptCount,
          grossRevenue: revenue || (completed * 500),
          completedConsultations: completed,
          waitingQueue: waiting,
        });
      } catch (error) {
        console.error("Dashboard loading failed:", error);
        setError(
          error instanceof Error ? error.message : "Unable to connect to backend"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") || localStorage.getItem("token") : null;
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear only admin session keys to protect other parallel tabs
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_role");
      localStorage.removeItem("admin_email");
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 pb-16 selection:bg-blue-600 selection:text-white">
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Hospital Operations Command Center
            </h1>
            <p className="text-[11px] text-slate-500">
              DrBlooMedi Hospital Administration • Real-Time Database Metrics & Live Telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-slate-900 px-4 py-2 text-xs font-bold transition border border-rose-200 shadow-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {error && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 font-medium">
            ℹ️ Backend notice: {error} (Displaying initialized state)
          </div>
        )}

        {/* 5 Metric Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On-Duty Specialists</p>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 text-base font-bold">🩺</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{loading ? "..." : stats.totalDoctors}</p>
            </div>
            <Link href="/admin/users" className="mt-4 text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1">
              <span>Staff Directory</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Patients</p>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-base font-bold">👥</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{loading ? "..." : stats.totalPatients}</p>
            </div>
            <Link href="/admin/patients" className="mt-4 text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1">
              <span>Patient Dossiers</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Frontdesk Staff</p>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 text-base font-bold">🧑‍💼</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{loading ? "..." : stats.totalReception}</p>
            </div>
            <Link href="/admin/users" className="mt-4 text-[11px] text-purple-600 font-bold hover:underline flex items-center gap-1">
              <span>Onboard Personnel</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical Wings</p>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 text-base font-bold">🏢</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{loading ? "..." : stats.totalDepartments}</p>
            </div>
            <Link href="/admin/departments" className="mt-4 text-[11px] text-amber-600 font-bold hover:underline flex items-center gap-1">
              <span>Departments</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Hospital Business</p>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-base font-bold">💰</span>
              </div>
              <p className="mt-3 text-xl font-black text-emerald-600">{loading ? "..." : `₹${stats.grossRevenue?.toLocaleString()}`}</p>
            </div>
            <Link href="/reception/dashboard" className="mt-4 text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1">
              <span>Discharge Desk</span> <span>→</span>
            </Link>
          </div>
        </div>

        {/* Lower Grid Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Live OPD Flow & Triage Activity
                  </h2>
                  <p className="text-[11px] text-slate-400">Multi-counter synchronization between Patient Portal & Doctor Cabins</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200">
                  Counters Online
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 py-2 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Live Queue</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">{loading ? "..." : stats.waitingQueue}</p>
                  <span className="text-[10px] text-slate-500 font-semibold">Waiting</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Consulted Today</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{loading ? "..." : stats.completedConsultations}</p>
                  <span className="text-[10px] text-slate-500 font-semibold">Rx Finalized</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Database</p>
                  <p className="text-2xl font-black text-purple-600 mt-1">{loading ? "..." : stats.totalPatients}</p>
                  <span className="text-[10px] text-slate-500 font-semibold">Patients</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}