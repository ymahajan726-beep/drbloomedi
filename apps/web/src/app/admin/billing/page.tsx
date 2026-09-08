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
  };
  doctor?: {
    id: number;
    specialization: string;
    user?: {
      email: string;
    };
  };
}

export default function BillingDirectoryPage() {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<BillingRecord | null>(null);

  // 1. Auth Guard
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const role = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();

    if (!token || (role !== 'ADMIN' && role !== 'RECEPTION')) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  // 2. Fetch Invoices
  const fetchBills = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.append('search', search.trim());
      if (statusFilter) queryParams.append('status', statusFilter);

      const res = await fetch(`https://drbloomedi-backend.onrender.com/billing?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBills(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchBills();
    }
  }, [isAuthorized, search, statusFilter]);

  // 3. Quick Status Change (Type-Safe)
  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`https://drbloomedi-backend.onrender.com/billing/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setBills((prev) =>
          prev.map((b) => (b.id === id ? { ...b, paymentStatus: newStatus } : b))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this invoice?')) return;
    try {
      const res = await fetch(`https://drbloomedi-backend.onrender.com/billing/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBills((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-xs">
        🔒 Checking Financial Clearance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Financial Billing & Invoices</h1>
            <p className="text-xs text-slate-400">Cashier Counter • Revenue & Invoicing</p>
          </div>
          <Link
            href="/admin/billing/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Create New Invoice</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search by invoice number, patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Doctor</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading invoices...</td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-600">
                        {bill.invoiceNumber}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{bill.patient?.fullName || 'Walk-in Patient'}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{bill.patient?.phone || '-'}</div>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        {bill.doctor ? (
                          <div>
                            <span className="font-bold">Dr. {bill.doctor.user?.email?.split('@')[0]}</span>
                            <span className="block text-[10px] text-slate-400">{bill.doctor.specialization}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Direct Counter</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₹{Number(bill.totalAmount).toFixed(2)}
                        </span>
                        {Number(bill.discount) > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-bold">
                            (-₹{bill.discount} Disc)
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-bold text-slate-600 font-mono text-[11px]">
                        {bill.paymentMethod}
                      </td>

                      <td className="p-3.5">
                        <select
                          value={bill.paymentStatus}
                          onChange={(e) => handleQuickStatusChange(bill.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border outline-none cursor-pointer ${
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

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setActiveReceipt(bill)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
                        >
                          🖨️ Receipt
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition text-xs"
                          title="Delete Invoice"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* A4 Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-slate-200 relative print:m-0 print:p-0 print:border-none print:shadow-none">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                🖨️ Print Receipt (A4)
              </button>
            </div>

            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-blue-600 tracking-tight">
                  DrBloo<span className="text-slate-900">Medi</span> Hospital
                </h2>
                <p className="text-[11px] text-slate-500">Accounts & Cashier Department</p>
                <p className="text-[10px] text-slate-400">Reg: HOSP-MH-2026-8819 • Phone: +91 98765 43210</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Tax Invoice / Receipt</span>
                <p className="text-sm font-mono font-bold text-blue-600 mt-0.5">{activeReceipt.invoiceNumber}</p>
                <p className="text-[10px] text-slate-400">
                  Date: {new Date(activeReceipt.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Billed To</p>
                <p className="font-bold text-slate-900 mt-0.5">{activeReceipt.patient?.fullName || 'Walk-in'}</p>
                <p className="text-slate-500">{activeReceipt.patient?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-slate-400">Consulting Specialist</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {activeReceipt.doctor ? `Dr. ${activeReceipt.doctor.user?.email?.split('@')[0]}` : 'General OPD Counter'}
                </p>
                <p className="text-slate-500">{activeReceipt.doctor?.specialization || 'Clinical Services'}</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden my-4">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Number(activeReceipt.consultationFee) > 0 && (
                  <tr>
                    <td className="p-2.5 font-medium text-slate-800">Doctor Consultation Fee</td>
                    <td className="p-2.5 text-right font-mono">₹{Number(activeReceipt.consultationFee).toFixed(2)}</td>
                  </tr>
                )}
                {Number(activeReceipt.treatmentCharges) > 0 && (
                  <tr>
                    <td className="p-2.5 font-medium text-slate-800">Treatment & Diagnostic Procedures</td>
                    <td className="p-2.5 text-right font-mono">₹{Number(activeReceipt.treatmentCharges).toFixed(2)}</td>
                  </tr>
                )}
                {Number(activeReceipt.medicineCharges) > 0 && (
                  <tr>
                    <td className="p-2.5 font-medium text-slate-800">Pharmacy & Dispensed Medicines</td>
                    <td className="p-2.5 text-right font-mono">₹{Number(activeReceipt.medicineCharges).toFixed(2)}</td>
                  </tr>
                )}
                {Number(activeReceipt.discount) > 0 && (
                  <tr className="text-emerald-600 font-medium">
                    <td className="p-2.5">Concession / Discount</td>
                    <td className="p-2.5 text-right font-mono">-₹{Number(activeReceipt.discount).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-700">
                  Payment Mode: <span className="font-mono text-slate-900">{activeReceipt.paymentMethod}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Status: <span className="font-bold uppercase text-emerald-600">{activeReceipt.paymentStatus}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed</span>
                <div className="text-xl font-black font-mono text-slate-900">
                  ₹{Number(activeReceipt.totalAmount).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-end text-[10px] text-slate-400">
              <div>* This is an official computer-generated receipt.</div>
              <div className="text-center w-36 border-t border-slate-300 pt-1">
                <p className="font-bold text-slate-700">Cashier Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}