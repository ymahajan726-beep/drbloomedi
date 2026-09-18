'use client';

import React, { useState, useEffect } from 'react';

interface ReportData {
  financials: {
    totalRevenue: number;
    pendingDues: number;
    totalDiscount: number;
    totalInvoices: number;
    paymentModes: Record<string, number>;
  };
  appointments: {
    totalAppointments: number;
    completedAppointments: number;
    scheduledAppointments: number;
    cancelledAppointments: number;
  };
  resources: {
    totalPatients: number;
    totalDoctors: number;
    totalDepartments: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    patient?: { fullName: string };
  }>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/reports/summary');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Aggregating hospital clinical & financial analytics...
      </div>
    );
  }

  const completionRate = data.appointments.totalAppointments
    ? Math.round(
        (data.appointments.completedAppointments /
          data.appointments.totalAppointments) *
          100,
      )
    : 0;

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            REP
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Hospital Analytics & Operational Reports
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Executive Summary • Real-time Revenue & Clinical Workflow Audits
            </p>
          </div>
        </div>

        <button
          onClick={loadReport}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
        >
          <span>↻</span> Refresh Analytics
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Top Level Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Inflow (Paid)
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{data.financials.totalRevenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400">
              Across {data.financials.totalInvoices} generated invoices
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Hospital Dues
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              ₹{data.financials.pendingDues.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400">Unsettled patient accounts</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Consultation Velocity
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {completionRate}%
            </p>
            <p className="text-[10px] text-slate-400">
              {data.appointments.completedAppointments} of{' '}
              {data.appointments.totalAppointments} appointments cleared
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Patient Registry
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
              {data.resources.totalPatients}
            </p>
            <p className="text-[10px] text-slate-400">
              Under {data.resources.totalDoctors} Active Doctors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              📅 Consultation Workflow Status
            </h2>
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Completed Sessions</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    {data.appointments.completedAppointments}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${
                        data.appointments.totalAppointments
                          ? (data.appointments.completedAppointments /
                              data.appointments.totalAppointments) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Scheduled / Waiting</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">
                    {data.appointments.scheduledAppointments}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{
                      width: `${
                        data.appointments.totalAppointments
                          ? (data.appointments.scheduledAppointments /
                              data.appointments.totalAppointments) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Cancelled / Missed</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                    {data.appointments.cancelledAppointments}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full"
                    style={{
                      width: `${
                        data.appointments.totalAppointments
                          ? (data.appointments.cancelledAppointments /
                              data.appointments.totalAppointments) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              💳 Collections by Payment Channel
            </h2>
            <div className="space-y-2.5">
              {Object.keys(data.financials.paymentModes).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center font-medium">
                  No payment transactions recorded yet.
                </p>
              ) : (
                Object.entries(data.financials.paymentModes).map(([mode, amt]) => (
                  <div
                    key={mode}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{mode}</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{amt.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Audit Ledger: Recent Billing Transactions
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[10px]">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Patient Name</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {data.recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-xs font-medium">
                      No recent invoices found.
                    </td>
                  </tr>
                ) : (
                  data.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {inv.patient?.fullName || 'Walk-in'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{inv.paymentMethod}</td>
                      <td className="py-3 px-3 font-bold font-mono text-slate-900 dark:text-white">
                        ₹{Number(inv.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-md font-semibold text-[10px] border ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}