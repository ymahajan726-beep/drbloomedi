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
    totalDoctors: 0, totalPatients: 0, totalReception: 0,
    totalDepartments: 4, grossRevenue: 0, completedConsultations: 0, waitingQueue: 0,
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

        const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
        const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

        const [dashRes, aptRes, billRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/admin`, { headers, credentials: "include" }).catch(() => null),
          fetch(`${API_URL}/appointments`, { headers, credentials: "include" }).catch(() => null),
          fetch(`${API_URL}/billing`, { headers, credentials: "include" }).catch(() => null),
        ]);

        let docCount = 0, patCount = 0, recCount = 0, deptCount = 4;
        if (dashRes && dashRes.ok) {
          const dashData = await dashRes.json();
          docCount = dashData.totalDoctors || 0;
          patCount = dashData.totalPatients || 0;
          recCount = dashData.totalReception || 0;
          deptCount = dashData.totalDepartments || 4;
        }

        let waiting = 0, completed = 0, revenue = 0;
        let settledList: any[] = [];

        if (billRes && billRes.ok) {
          const billList = await billRes.json();
          if (Array.isArray(billList)) {
            const now = Date.now();
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

            billList.forEach((bill: any) => {
              const statusValues = [bill.status, bill.paymentStatus, bill.payment_status]
                .filter((s) => s != null)
                .map((s) => String(s).trim().toUpperCase());
              const isPaid = statusValues.some((s) => ["PAID", "SUCCESS", "COMPLETED"].includes(s)) || bill.isPaid === true;
              const amt = Number(bill.amount ?? bill.totalAmount ?? bill.netAmount);

              if (isPaid && Number.isFinite(amt)) {
                revenue += amt;
                const billTime = new Date(bill.updatedAt || bill.createdAt || Date.now()).getTime();

                if (now - billTime <= TWENTY_FOUR_HOURS || isNaN(billTime)) {
                  settledList.push({
                    id: bill.id || Math.random(),
                    amount: amt,
                    patientName: bill.patient?.fullName || bill.patientName || 'Verified Patient',
                    token: bill.appointment?.appointmentNumber || bill.invoiceNumber || 'OPD',
                    phone: bill.patient?.phone || bill.phone || 'N/A',
                    mode: bill.paymentMethod || 'Online / Cash',
                    time: !isNaN(billTime) ? new Date(billTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
                  });
                }
              }
            });
          }
        }

        if (aptRes && aptRes.ok) {
          const aptList = await aptRes.json();
          if (Array.isArray(aptList)) {
            aptList.forEach((apt: any) => {
              const isDone = [apt.status, apt.paymentStatus]
                .filter((s) => s != null)
                .some((s) => ["COMPLETED", "PAID", "SUCCESS"].includes(String(s).trim().toUpperCase())) || apt.isPaid === true;

              if (isDone) completed++; else waiting++;
            });
            if (patCount === 0) patCount = aptList.length;
          }
        }

        setRecentSettled(settledList.reverse());
        setStats({
          totalDoctors: docCount, totalPatients: patCount, totalReception: recCount,
          totalDepartments: deptCount, grossRevenue: revenue, completedConsultations: completed, waitingQueue: waiting,
        });
      } catch (err) {
        console.error("Dashboard loading failed:", err);
        setError(err instanceof Error ? err.message : "Unable to connect to backend");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    const interval = setInterval(loadDashboard, 7000);
    return () => clearInterval(interval);
  }, []);

  const downloadExcelReport = (monthKey: string, reportData: any) => {
    let csvContent = "data:text/csv;charset=utf-8,Bill ID,Patient Name,Amount (INR),Payment Mode\n";
    if (Array.isArray(reportData)) {
      reportData.forEach((val: any) => {
        csvContent += [val.id, val.patientName || 'N/A', val.amount || 500, val.mode || 'Online/Cash'].join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DrBlooMedi_Monthly_Report_${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      <style jsx global>{`::-webkit-scrollbar { display: none; } * { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            ADM
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Hospital Operations Command Center
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              DrBlooMedi Hospital Administration • Real-Time Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[11px] font-semibold rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Database Synced
          </span>

          <button onClick={() => setShowArchiveModal(true)} className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
            📁 Monthly Reports
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 font-medium">
            ℹ️ Backend notice: {error} (Displaying initialized state)
          </div>
        )}

        {/* Metric Cards - Cleaned up without extra floating duplicate boxes */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">On-Duty Specialists</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{loading ? "..." : stats.totalDoctors}</p>
            </div>
            <Link href="/admin/users" className="mt-4 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">Staff Directory →</Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Patients</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{loading ? "..." : stats.totalPatients}</p>
            </div>
            <Link href="/admin/patients" className="mt-4 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">Patient Dossiers →</Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Frontdesk Staff</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{loading ? "..." : stats.totalReception}</p>
            </div>
            <Link href="/admin/users" className="mt-4 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">Onboard Personnel →</Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Clinical Wings</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{loading ? "..." : stats.totalDepartments}</p>
            </div>
            <Link href="/admin/departments" className="mt-4 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">Departments →</Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Hospital Business</p>
              <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{loading ? "..." : `₹${stats.grossRevenue?.toLocaleString()}`}</p>
            </div>
            <Link href="/reception/dashboard" className="mt-4 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">Discharge Desk →</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live OPD Flow & Triage Activity</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-counter synchronization between Patient Portal & Doctor Cabins</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold rounded-md border border-emerald-200 dark:border-emerald-900">Counters Online</span>
              </div>

              <div className="grid grid-cols-3 gap-3 py-1 text-center">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Live Queue</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{loading ? "..." : stats.waitingQueue}</p>
                  <span className="text-[10px] text-slate-400 font-medium">Waiting</span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Consulted Today</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{loading ? "..." : stats.completedConsultations}</p>
                  <span className="text-[10px] text-slate-400 font-medium">Rx Finalized</span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Database</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{loading ? "..." : stats.totalPatients}</p>
                  <span className="text-[10px] text-slate-400 font-medium">Patients</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Successfully Paid Patient Settlements (Last 24 Hours)</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Database-backed rolling window showing settled bills</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-md border border-emerald-200 dark:border-emerald-900">Database Feed Active</span>
              </div>

              <div className="space-y-2">
                {recentSettled.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center font-medium">No paid patient settlements recorded in the last 24 hours.</p>
                ) : (
                  recentSettled.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-200 dark:border-emerald-900">✓</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.patientName || 'Patient'}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Token: {item.token || 'OPD'} • Mobile: {item.phone} • Mode: {item.mode}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">₹{item.amount}.00</span>
                        <span className="block text-[10px] text-slate-400">{item.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Monthly Reports Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Archived Monthly Reports</h3>
              <button onClick={() => setShowArchiveModal(false)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto text-xs">
              {monthlyReports.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No previous monthly reports archived yet.</p>
              ) : (
                monthlyReports.map((rep, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex justify-between items-center border border-slate-200 dark:border-slate-700">
                    <div><p className="font-semibold text-slate-900 dark:text-white">Month: {rep.month}</p></div>
                    <button onClick={() => downloadExcelReport(rep.month, rep.data)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[10px] transition cursor-pointer shadow-2xs">
                      📊 Download Excel/CSV
                    </button>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowArchiveModal(false)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-2xs">Close Archive</button>
          </div>
        </div>
      )}
    </div>
  );
}