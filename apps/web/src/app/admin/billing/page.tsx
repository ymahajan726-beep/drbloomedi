'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BillingRecord {
  id: string;
  invoiceNumber: string;
  consultationFee: number;
  treatmentCharges: number;
  medicineCharges: number;
  discount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  patient?: {
    id: string;
    fullName: string;
    phone: string;
    bloodGroup?: string;
  };
  doctor?: {
    id: number;
    specialization: string;
    user?: { email: string };
  };
}

export default function BillingListPage() {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState<BillingRecord | null>(null);

  const loadBilling = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:4000/billing?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBills(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load billing records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, [search, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:4000/billing/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadBilling();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}?`)) return;
    try {
      await fetch(`http://localhost:4000/billing/${id}`, { method: 'DELETE' });
      loadBilling();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalRevenue = bills
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const pendingAmount = bills
    .filter((b) => b.paymentStatus === 'Pending')
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Billing & Invoices
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage Patient Financial Records, Consultation Invoices & Receipts
          </p>
        </div>
        <Link
          href="/admin/billing/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Create Invoice</span>
        </Link>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Invoices
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{bills.length}</p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">💳</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Collected Revenue
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">💰</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Dues
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              ₹{pendingAmount.toLocaleString()}
            </p>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">⏳</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search invoice number, patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50/50 outline-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading invoices...
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">💳</span>
            <p className="text-sm font-semibold text-slate-700">No invoices generated yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Create Invoice&quot; to bill a patient.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                        {bill.invoiceNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{bill.patient?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{bill.patient?.phone}</div>
                    </td>
                    <td className="p-4 text-slate-700">
                      {bill.doctor?.user?.email || 'General OPD'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold text-[11px]">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-900 text-sm">
                      ₹{Number(bill.totalAmount).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <select
                        value={bill.paymentStatus}
                        onChange={(e) => handleStatusChange(bill.id, e.target.value)}
                        className={`font-bold text-[10px] rounded-full px-2.5 py-1 border outline-none cursor-pointer ${
                          bill.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : bill.paymentStatus === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setActiveReceipt(bill)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                      >
                        <span>🖨️</span>
                        <span>Print</span>
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id, bill.invoiceNumber)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6 border border-slate-200">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex justify-between items-center print:hidden border-b pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Invoice Preview
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Receipt Printable Canvas */}
            <div className="p-4 border border-dashed border-slate-200 rounded-xl space-y-4 text-slate-800">
              <div className="text-center pb-3 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">DrBlooMedi Multi-Speciality Hospital</h2>
                <p className="text-[11px] text-slate-500">Official Patient Payment Receipt & Cash Memo</p>
              </div>

              <div className="grid grid-cols-2 text-xs gap-2 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
                  <span className="font-bold text-slate-900">{activeReceipt.patient?.fullName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Number</span>
                  <span className="font-mono font-bold text-blue-600">{activeReceipt.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                  <span className="font-medium text-slate-700">{activeReceipt.patient?.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Date</span>
                  <span className="font-medium text-slate-700">
                    {new Date(activeReceipt.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border-t border-slate-200 pt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] border-b pb-1">
                      <th className="text-left font-bold pb-1">Description</th>
                      <th className="text-right font-bold pb-1">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-1.5 text-slate-600">Consultation Charges</td>
                      <td className="py-1.5 text-right font-medium">₹{Number(activeReceipt.consultationFee).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-600">Treatment & Clinical Care</td>
                      <td className="py-1.5 text-right font-medium">₹{Number(activeReceipt.treatmentCharges).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-600">Pharmacy / Medical Consumables</td>
                      <td className="py-1.5 text-right font-medium">₹{Number(activeReceipt.medicineCharges).toFixed(2)}</td>
                    </tr>
                    {Number(activeReceipt.discount) > 0 && (
                      <tr className="text-emerald-600">
                        <td className="py-1.5 font-medium">Hospital Concession / Discount</td>
                        <td className="py-1.5 text-right font-bold">- ₹{Number(activeReceipt.discount).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grand Total Bar */}
              <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Payment Method</span>
                  <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {activeReceipt.paymentMethod} • {activeReceipt.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Grand Total Paid</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{Number(activeReceipt.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-center pt-4 text-[10px] text-slate-400">
                Thank you for visiting DrBlooMedi. Get well soon!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}