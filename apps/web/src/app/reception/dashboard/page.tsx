'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  patient?: {
    id: string;
    fullName: string;
    phone: string;
  };
  doctor?: {
    id: number;
    specialization: string;
    user?: { email: string };
  };
}

interface ConsolidatedBill {
  patient: {
    id: string;
    fullName: string;
    phone: string;
  };
  lineItems: Array<{
    itemDescription: string;
    category: string;
    amount: number;
  }>;
  subTotal: number;
  gstAmount: number;
  totalAmount: number;
  invoiceDate: string;
}

export default function ReceptionDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Bill Modal States
  const [selectedBill, setSelectedBill] = useState<ConsolidatedBill | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch Consolidated Bill
  const handleGenerateBill = async (patientId: string) => {
    try {
      setBillLoading(true);
      const res = await fetch(`http://localhost:4000/billing/consolidated/${patientId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch consolidated bill');
      }
      const data = await res.json();
      setSelectedBill(data);
      setIsBillModalOpen(true);
    } catch (err: any) {
      alert(`Billing Error: ${err.message}`);
    } finally {
      setBillLoading(false);
    }
  };

  // 2. Settle Bill & Discharge (Safe payload)
  const handleSettleBill = async () => {
    if (!selectedBill?.patient?.id) return;
    try {
      setSettling(true);
      const res = await fetch(
        `http://localhost:4000/billing/consolidated/${selectedBill.patient.id}/settle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethod: 'CASH' }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to settle bill');
      }

      alert('Discharge Bill Settled & Marked as PAID successfully!');
      setIsBillModalOpen(false);
      setSelectedBill(null);
      loadAppointments();
    } catch (err: any) {
      alert(`Settlement Error: ${err.message}`);
    } finally {
      setSettling(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const q = search.toLowerCase();
    return (
      apt.appointmentNumber?.toLowerCase().includes(q) ||
      apt.patient?.fullName?.toLowerCase().includes(q) ||
      apt.patient?.phone?.includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reception Desk & Billing Counter
          </h1>
          <p className="text-xs text-slate-500">
            Patient check-ins, appointment tracking, and consolidated discharge billing
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/appointments/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            + New Appointment
          </Link>
        </div>
      </div>

      {/* Appointment Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-4">
          <input
            type="text"
            placeholder="Search by Patient Name, Phone or Token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600"
          />
          <button
            onClick={loadAppointments}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {apt.appointmentNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {apt.patient?.fullName || 'Walk-in Patient'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {apt.patient?.phone || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {apt.appointmentDate} • <span className="font-semibold">{apt.timeSlot}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {apt.patient?.id && (
                        <button
                          onClick={() => handleGenerateBill(apt.patient!.id)}
                          disabled={billLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1"
                        >
                          <span>🧾</span>
                          <span>Discharge Bill</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONSOLIDATED BILL MODAL */}
      {isBillModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase">
                  Consolidated Discharge Invoice
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {selectedBill.patient?.fullName}
                </h2>
                <p className="text-xs text-slate-500">
                  Phone: {selectedBill.patient?.phone} • Date:{' '}
                  {new Date(selectedBill.invoiceDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Service Breakdown
              </span>
              {selectedBill.lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl text-xs border border-slate-100"
                >
                  <span className="font-semibold text-slate-800">{item.itemDescription}</span>
                  <span className="font-bold text-slate-900">₹{Number(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sub Total:</span>
                <span className="font-bold">₹{selectedBill.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hospital GST (5%):</span>
                <span className="font-bold">₹{selectedBill.gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                <span>Grand Total Payable:</span>
                <span className="text-emerald-600">₹{selectedBill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <span>🖨️</span> Print Invoice
              </button>
              <button
                type="button"
                disabled={settling}
                onClick={handleSettleBill}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                {settling ? 'Settling...' : '✓ Pay & Discharge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}