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
      <div className="p-12 text-center text-slate-400 text-xs font-sans">
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Hospital Analytics & Operational Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Executive Summary • Real-time Revenue & Clinical Workflow Audits
          </p>
        </div>
        <button
          onClick={loadReport}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top Level Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Inflow (Paid)
          </p>
          <p className="text-2xl font-black text-emerald-600">
            ₹{data.financials.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">
            Across {data.financials.totalInvoices} generated invoices
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pending Hospital Dues
          </p>
          <p className="text-2xl font-black text-amber-600">
            ₹{data.financials.pendingDues.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Unsettled patient accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Consultation Velocity
          </p>
          <p className="text-2xl font-black text-blue-600">
            {completionRate}%
          </p>
          <p className="text-[11px] text-slate-400">
            {data.appointments.completedAppointments} of{' '}
            {data.appointments.totalAppointments} appointments cleared
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Patient Registry
          </p>
          <p className="text-2xl font-black text-indigo-600">
            {data.resources.totalPatients}
          </p>
          <p className="text-[11px] text-slate-400">
            Under {data.resources.totalDoctors} Active Doctors
          </p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            📅 Consultation Workflow Status
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Completed Sessions</span>
                <span className="text-emerald-700 font-bold">
                  {data.appointments.completedAppointments}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Scheduled / Waiting</span>
                <span className="text-amber-700 font-bold">
                  {data.appointments.scheduledAppointments}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Cancelled / Missed</span>
                <span className="text-rose-700 font-bold">
                  {data.appointments.cancelledAppointments}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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

        {/* Payment Channels Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            💳 Collections by Payment Channel
          </h2>
          <div className="space-y-2.5">
            {Object.keys(data.financials.paymentModes).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No payment transactions recorded yet.
              </p>
            ) : (
              Object.entries(data.financials.paymentModes).map(([mode, amt]) => (
                <div
                  key={mode}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
                >
                  <span className="text-xs font-bold text-slate-700">{mode}</span>
                  <span className="text-xs font-black text-slate-900">
                    ₹{amt.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Ledger Entries */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Audit Ledger: Recent Billing Transactions
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Patient Name</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-slate-800">
                    {inv.invoiceNumber}
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {inv.patient?.fullName || 'Walk-in'}
                  </td>
                  <td className="p-4 text-slate-600">{inv.paymentMethod}</td>
                  <td className="p-4 font-black text-slate-900">
                    ₹{Number(inv.totalAmount).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}