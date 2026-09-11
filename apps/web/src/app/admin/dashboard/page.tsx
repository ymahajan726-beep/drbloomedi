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

  const [recentSettled, setRecentSettled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

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
        let settledList: any[] = [];

        // Monthly & 30-day reset logic check
        const currentMonthKey = new Date().toISOString().slice(0, 7); // e.g., '2026-09'
        const savedMonth = localStorage.getItem("drbloomedi_active_month");
        
        if (savedMonth && savedMonth !== currentMonthKey) {
          // New month started: Archive old month data into reports and reset current ledger
          const oldLedger = localStorage.getItem("drbloomedi_paid_appointments_v2");
          if (oldLedger) {
            const reports = JSON.parse(localStorage.getItem("drbloomedi_monthly_reports") || "[]");
            reports.push({ month: savedMonth, data: JSON.parse(oldLedger) });
            localStorage.setItem("drbloomedi_monthly_reports", JSON.stringify(reports));
          }
          localStorage.setItem("drbloomedi_paid_appointments_v2", JSON.stringify({}));
          localStorage.setItem("drbloomedi_active_month", currentMonthKey);
        } else if (!savedMonth) {
          localStorage.setItem("drbloomedi_active_month", currentMonthKey);
        }

        // Load archived monthly reports
        try {
          const storedReports = localStorage.getItem("drbloomedi_monthly_reports");
          if (storedReports) setMonthlyReports(JSON.parse(storedReports));
        } catch {}

        // Fetch actual paid settlements from ledger
        try {
          const ledger = localStorage.getItem("drbloomedi_paid_appointments_v2");
          if (ledger) {
            const parsed = JSON.parse(ledger);
            let ledgerRev = 0;
            Object.entries(parsed).forEach(([aptId, p]: [string, any]) => {
              if (p?.isPaid) {
                const amt = Number(p?.amount || 500);
                ledgerRev += amt;
                settledList.push({
                  id: aptId,
                  amount: amt,
                  patientName: p.patient?.fullName || 'Verified Patient',
                  token: p.appointmentNumber || 'OPD',
                  phone: p.patient?.phone || 'Paid Online/Cash',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
              }
            });
            revenue = ledgerRev;
          }
        } catch {}

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
                if (!settledList.some(s => s.id === apt.id) && (apt.isPaid || apt.paymentStatus === 'PAID')) {
                  const aptFee = Number(apt.doctor?.consultationFee) || 500;
                  settledList.push({
                    id: apt.id,
                    token: apt.appointmentNumber || 'OPD',
                    patientName: apt.patient?.fullName || 'Walk-in Patient',
                    phone: apt.patient?.phone || 'N/A',
                    amount: aptFee,
                    mode: apt.paymentMethod || 'Hospital Counter'
                  });
                }
              } else {
                waiting++;
              }
            });

            if (patCount === 0) {
              patCount = aptList.length;
            }
          }
        }

        setRecentSettled(settledList.reverse());

        setStats({
          totalDoctors: docCount,
          totalPatients: patCount,
          totalReception: recCount,
          totalDepartments: deptCount,
          grossRevenue: revenue,
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
    const interval = setInterval(loadDashboard, 7000);
    return () => clearInterval(interval);
  }, []);

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
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_role");
      localStorage.removeItem("admin_email");
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans text-slate-900 dark:text-slate-100 pb-16 selection:bg-blue-600 selection:text-white transition-colors">
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
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Hospital Operations Command Center
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              DrBlooMedi Hospital Administration • Real-Time Database Metrics & Live Telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-2 text-xs font-bold transition border border-blue-200 dark:border-blue-900 shadow-xs cursor-pointer"
            >
              📁 Monthly Reports
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white px-4 py-2 text-xs font-bold transition border border-rose-200 dark:border-rose-900 shadow-xs cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {error && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 font-medium">
            ℹ️ Backend notice: {error} (Displaying initialized state)
          </div>
        )}

        {/* 5 Metric Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl bg-white dark:bg-[#111827] p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On-Duty Specialists</p>
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-base font-bold">🩺</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{loading ? "..." : stats.totalDoctors}</p>
            </div>
            <Link href="/admin/users" className="mt-4 text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
              <span>Staff Directory</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#111827] p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Patients</p>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-base font-bold">👥</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{loading ? "..." : stats.totalPatients}</p>
            </div>
            <Link href="/admin/patients" className="mt-4 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
              <span>Patient Dossiers</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#111827] p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Frontdesk Staff</p>
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 text-base font-bold">🧑‍💼</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{loading ? "..." : stats.totalReception}</p>
            </div>
            <Link href="/admin/users" className="mt-4 text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1">
              <span>Onboard Personnel</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#111827] p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical Wings</p>
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-base font-bold">🏢</span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{loading ? "..." : stats.totalDepartments}</p>
            </div>
            <Link href="/admin/departments" className="mt-4 text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1">
              <span>Departments</span> <span>→</span>
            </Link>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#111827] p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Hospital Business</p>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-base font-bold">💰</span>
              </div>
              <p className="mt-3 text-xl font-black text-emerald-600 dark:text-emerald-400">{loading ? "..." : `₹${stats.grossRevenue?.toLocaleString()}`}</p>
            </div>
            <Link href="/reception/dashboard" className="mt-4 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
              <span>Discharge Desk</span> <span>→</span>
            </Link>
          </div>
        </div>

        {/* Lower Grid Sections */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Live OPD Flow & Triage Activity
                  </h2>
                  <p className="text-[11px] text-slate-400">Multi-counter synchronization between Patient Portal & Doctor Cabins</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-900">
                  Counters Online
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 py-2 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1f2937] border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Live Queue</p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{loading ? "..." : stats.waitingQueue}</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Waiting</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1f2937] border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Consulted Today</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{loading ? "..." : stats.completedConsultations}</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Rx Finalized</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1f2937] border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Database</p>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{loading ? "..." : stats.totalPatients}</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Patients</span>
                </div>
              </div>
            </div>

            {/* LIVE RECENT SETTLED BILLS FEED */}
            <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Successfully Paid Patient Settlements
                  </h2>
                  <p className="text-[11px] text-slate-400">Real-time list of patients whose bills have been fully settled</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                  Live Feed Active
                </span>
              </div>

              <div className="space-y-2">
                {recentSettled.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center font-medium">No paid patient settlements recorded yet.</p>
                ) : (
                  recentSettled.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1f2937] border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">✓</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.patientName || 'Patient'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Token: {item.token || 'OPD'} • {item.phone || item.mode}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{item.amount}.00</span>
                        <span className="block text-[10px] text-slate-400">Paid Successfully</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MONTHLY REPORTS ARCHIVE MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Archived Monthly Reports</h3>
              <button onClick={() => setShowArchiveModal(false)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">✕</button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto text-xs">
              {monthlyReports.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No previous monthly reports archived yet. Reports generate automatically after 30 days/month rollover.</p>
              ) : (
                monthlyReports.map((rep, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-[#1f2937] rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Month: {rep.month}</p>
                      <p className="text-[10px] text-slate-400">Entries recorded: {Object.keys(rep.data || {}).length}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 font-bold rounded-lg text-[10px]">Archived</span>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowArchiveModal(false)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs cursor-pointer">Close Archive</button>
          </div>
        </div>
      )}
    </div>
  );
}