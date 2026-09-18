'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActiveToken, getAuthHeaders } from '@/utils/session';

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

  useEffect(() => {
    const token = getActiveToken();
    const role = sessionStorage.getItem('userRole')?.toUpperCase();

    if (!token || (role !== 'ADMIN' && role !== 'RECEPTION')) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.append('search', search.trim());
      if (statusFilter) queryParams.append('status', statusFilter);

      const res = await fetch(
        `https://drbloomedi-backend.onrender.com/billing?${queryParams.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );

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

  
  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(
        `https://drbloomedi-backend.onrender.com/billing/${id}/status`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus }),
        }
      );

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
      const res = await fetch(
        `https://drbloomedi-backend.onrender.com/billing/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (res.ok) {
        setBills((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 font-mono text-xs">
        🔒 Checking Financial Clearance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            BIL
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Financial Billing & Invoices
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cashier Counter • Revenue & Invoicing
            </p>
          </div>
        </div>

        <Link
          href="/admin/billing/new"
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>+</span>
          <span>Create New Invoice</span>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search by invoice number, patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 font-medium transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-600 transition"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[10px]">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Patient Details</th>
                  <th className="py-3 px-3">Doctor</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500 font-mono text-xs"
                    >
                      Loading invoices...
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500 text-xs font-medium"
                    >
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {bill.invoiceNumber}

                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div>
                          {bill.patient?.fullName || 'Walk-in Patient'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {bill.patient?.phone || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {bill.doctor ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              Dr. {bill.doctor.user?.email?.split('@')[0]}
                            </span>
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              {bill.doctor.specialization}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Direct Counter
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          ₹{Number(bill.totalAmount).toFixed(2)}
                        </span>

                        {Number(bill.discount) > 0 && (
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            (-₹{bill.discount} Disc)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {bill.paymentMethod}
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={bill.paymentStatus}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              bill.id,
                              e.target.value
                            )
                          }
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border outline-none cursor-pointer ${
                            bill.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                              : bill.paymentStatus === 'Cancelled'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                          }`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Partially Paid">
                            Partially Paid
                          </option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => setActiveReceipt(bill)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-slate-300 dark:border-slate-700"
                        >
                          🖨️ Receipt
                        </button>

                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition text-xs cursor-pointer"
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
      </main>

      {/* A4 Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative print:m-0 print:p-0 print:border-none print:shadow-none">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                ✕ Close
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                🖨️ Print Receipt (A4)
              </button>
            </div>

            <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  DrBloo<span className="text-slate-900 dark:text-white">Medi</span> Hospital
                </h2>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Accounts & Cashier Department
                </p>

                <p className="text-[10px] text-slate-400">
                  Reg: HOSP-MH-2026-8819 • Phone: +91 98765 43210
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Tax Invoice / Receipt
                </span>

                <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {activeReceipt.invoiceNumber}
                </p>

                <p className="text-[10px] text-slate-400">
                  Date:{' '}
                  {new Date(
                    activeReceipt.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Billed To
                </p>

                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeReceipt.patient?.fullName || 'Walk-in'}
                </p>

                <p className="text-slate-500 dark:text-slate-400 font-mono">
                  {activeReceipt.patient?.phone}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Consulting Specialist
                </p>

                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeReceipt.doctor
                    ? `Dr. ${activeReceipt.doctor.user?.email?.split('@')[0]}`
                    : 'General OPD Counter'}
                </p>

                <p className="text-slate-500 dark:text-slate-400">
                  {activeReceipt.doctor?.specialization ||
                    'Clinical Services'}
                </p>
              </div>
            </div>

            <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden my-4">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {Number(activeReceipt.consultationFee) > 0 && (
                  <tr>
                    <td className="p-2.5 text-slate-800 dark:text-slate-200">
                      Doctor Consultation Fee
                    </td>

                    <td className="p-2.5 text-right font-mono text-slate-900 dark:text-slate-100">
                      ₹
                      {Number(
                        activeReceipt.consultationFee
                      ).toFixed(2)}
                    </td>
                  </tr>
                )}

                {Number(activeReceipt.treatmentCharges) > 0 && (
                  <tr>
                    <td className="p-2.5 text-slate-800 dark:text-slate-200">
                      Treatment & Diagnostic Procedures
                    </td>

                    <td className="p-2.5 text-right font-mono text-slate-900 dark:text-slate-100">
                      ₹
                      {Number(
                        activeReceipt.treatmentCharges
                      ).toFixed(2)}
                    </td>
                  </tr>
                )}

                {Number(activeReceipt.medicineCharges) > 0 && (
                  <tr>
                    <td className="p-2.5 text-slate-800 dark:text-slate-200">
                      Pharmacy & Dispensed Medicines
                    </td>

                    <td className="p-2.5 text-right font-mono text-slate-900 dark:text-slate-100">
                      ₹
                      {Number(
                        activeReceipt.medicineCharges
                      ).toFixed(2)}
                    </td>
                  </tr>
                )}

                {Number(activeReceipt.discount) > 0 && (
                  <tr className="text-emerald-600 dark:text-emerald-400 font-medium">
                    <td className="p-2.5">
                      Concession / Discount
                    </td>

                    <td className="p-2.5 text-right font-mono">
                      -₹
                      {Number(
                        activeReceipt.discount
                      ).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Payment Mode:{' '}
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {activeReceipt.paymentMethod}
                  </span>
                </p>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Status:{' '}
                  <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    {activeReceipt.paymentStatus}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Total Billed
                </span>

                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  ₹{Number(activeReceipt.totalAmount).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end text-[10px] text-slate-400">
              <div>* This is an official computer-generated receipt.</div>

              <div className="text-center w-36 border-t border-slate-300 dark:border-slate-700 pt-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Cashier Signature
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}