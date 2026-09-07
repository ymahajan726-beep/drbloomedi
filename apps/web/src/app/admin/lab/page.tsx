'use client';

import React, { useState, useEffect } from 'react';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
}

interface Doctor {
  id: number;
  specialization: string;
  user?: { email: string };
}

interface LabTest {
  id: string;
  testName: string;
  category: string;
  price: number;
  sampleType?: string;
  unit?: string;
  normalRange?: string;
}

interface LabOrder {
  id: string;
  orderNumber: string;
  status: string;
  resultValue?: string;
  reportFileUrl?: string;
  technicianRemarks?: string;
  isAbnormal: boolean;
  billedAmount: number;
  createdAt: string;
  patient?: Patient;
  doctor?: Doctor;
  labTest?: LabTest;
}

export default function LabManagementPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [resultOrder, setResultOrder] = useState<LabOrder | null>(null);
  const [reportOrder, setReportOrder] = useState<LabOrder | null>(null);

  // New Order Form
  const [newPatientId, setNewPatientId] = useState('');
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newLabTestId, setNewLabTestId] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Result Entry Form
  const [resultValue, setResultValue] = useState('');
  const [reportFileUrl, setReportFileUrl] = useState('');
  const [technicianRemarks, setTechnicianRemarks] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [resultSubmitting, setResultSubmitting] = useState(false);

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

  // 2. Fetch Initial Meta
  useEffect(() => {
    if (!isAuthorized) return;

    async function loadMeta() {
      try {
        const [testsRes, patientsRes, docsRes] = await Promise.all([
          fetch('http://localhost:4000/lab/tests'),
          fetch('http://localhost:4000/patients'),
          fetch('http://localhost:4000/doctors'),
        ]);

        if (testsRes.ok) setTests(await testsRes.json());
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (docsRes.ok) setDoctors(await docsRes.json());
      } catch (err) {
        console.error('Failed to load lab dependencies', err);
      }
    }

    loadMeta();
  }, [isAuthorized]);

  // 3. Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search.trim()) query.append('search', search.trim());
      if (statusFilter) query.append('status', statusFilter);

      const res = await fetch(`http://localhost:4000/lab/orders?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load lab orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
    }
  }, [isAuthorized, search, statusFilter]);

  // 4. Create Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId || !newLabTestId) {
      alert('Please select both patient and lab test.');
      return;
    }

    try {
      setOrderSubmitting(true);
      const res = await fetch('http://localhost:4000/lab/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: newPatientId,
          labTestId: newLabTestId,
          doctorId: newDoctorId ? Number(newDoctorId) : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to create lab order');
      }

      setIsOrderModalOpen(false);
      setNewPatientId('');
      setNewDoctorId('');
      setNewLabTestId('');
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Order creation failed');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // 5. Update Status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:4000/lab/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Status transition failed');
      }

      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Could not update status');
    }
  };

  // 6. Record Results
  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultOrder) return;

    if (!resultValue.trim() && !reportFileUrl.trim()) {
      alert('Please provide either a test result value or attach a report document.');
      return;
    }

    try {
      setResultSubmitting(true);
      const res = await fetch(`http://localhost:4000/lab/orders/${resultOrder.id}/result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultValue,
          reportFileUrl,
          technicianRemarks,
          isAbnormal,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to record result');
      }

      setResultOrder(null);
      setResultValue('');
      setReportFileUrl('');
      setTechnicianRemarks('');
      setIsAbnormal(false);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Error recording test results');
    } finally {
      setResultSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-xs">
        🔒 Verifying Pathology & Lab Clearance...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Pathology & Diagnostic Laboratory</h1>
          <p className="text-xs text-slate-400">Sample Tracking • Diagnostic Entry • Clinical Reporting</p>
        </div>
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Book New Lab Test</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[260px]">
          <input
            type="text"
            placeholder="Search by order #, patient name, or test..."
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
            <option value="">All Statuses</option>
            <option value="Ordered">Ordered</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Patient Info</th>
                <th className="p-3.5">Diagnostic Test</th>
                <th className="p-3.5">Ref. Doctor</th>
                <th className="p-3.5">Diagnostic Result</th>
                <th className="p-3.5">Progress Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading lab orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                    No lab test orders found. Click "+ Book New Lab Test" to register an order.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isDone = order.status === 'Completed';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-600">
                        {order.orderNumber}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{order.patient?.fullName || 'Walk-in'}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{order.patient?.phone || '-'}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{order.labTest?.testName || 'Diagnostic Test'}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                          {order.labTest?.category || 'General'}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        {order.doctor ? (
                          <div>
                            <span className="font-bold">Dr. {order.doctor.user?.email?.split('@')[0]}</span>
                            <span className="block text-[10px] text-slate-400">{order.doctor.specialization}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Self / OPD Counter</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {order.resultValue || order.reportFileUrl ? (
                          <div>
                            {order.resultValue && (
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded ${
                                  order.isAbnormal
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {order.resultValue} {order.labTest?.unit || ''}
                              </span>
                            )}
                            {order.reportFileUrl && (
                              <a
                                href={order.reportFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[11px] text-blue-600 font-semibold hover:underline mt-1"
                              >
                                📄 View Attached File
                              </a>
                            )}
                            {order.isAbnormal && (
                              <span className="block text-[9px] text-rose-500 font-bold mt-0.5">⚠️ Out of Range</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Awaiting Findings</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <select
                          value={order.status}
                          disabled={isDone}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border outline-none ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                              : order.status === 'Sample Collected'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-pointer'
                              : order.status === 'In Progress'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 cursor-pointer'
                              : 'bg-amber-50 text-amber-700 border-amber-200 cursor-pointer'
                          }`}
                        >
                          <option value="Ordered">Ordered</option>
                          <option value="Sample Collected">Sample Collected</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed" disabled={!order.resultValue && !order.reportFileUrl}>
                            Completed
                          </option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        {!isDone && (
                          <button
                            onClick={() => {
                              setResultOrder(order);
                              setResultValue(order.resultValue || '');
                              setReportFileUrl(order.reportFileUrl || '');
                              setTechnicianRemarks(order.technicianRemarks || '');
                              setIsAbnormal(order.isAbnormal || false);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition"
                          >
                            🔬 Enter Result
                          </button>
                        )}

                        {isDone && (
                          <button
                            onClick={() => setReportOrder(order)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition shadow-sm"
                          >
                            🖨️ Report
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. BOOK TEST MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Book Patient Diagnostic Test</h3>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Select Patient *</label>
                <select
                  required
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-slate-50"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} • {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Diagnostic Test *</label>
                <select
                  required
                  value={newLabTestId}
                  onChange={(e) => setNewLabTestId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-slate-50"
                >
                  <option value="">-- Choose Lab Test --</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.testName} ({t.category}) - ₹{Number(t.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Prescribing Doctor (Optional)</label>
                <select
                  value={newDoctorId}
                  onChange={(e) => setNewDoctorId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none text-slate-800 bg-slate-50"
                >
                  <option value="">-- None / Self Booking --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.user?.email || 'Doctor'} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {orderSubmitting ? 'Booking...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECORD RESULT MODAL */}
      {resultOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">Record Diagnostic Finding</h3>
            <p className="text-xs text-slate-400 mt-0.5">Order #{resultOrder.orderNumber}</p>

            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <p className="font-bold text-slate-900">{resultOrder.labTest?.testName}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Normal Reference Range:{' '}
                <span className="font-mono font-bold text-slate-800">
                  {resultOrder.labTest?.normalRange || 'N/A'} {resultOrder.labTest?.unit || ''}
                </span>
              </p>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Test Result Value</label>
                <input
                  type="text"
                  placeholder="e.g. 98.4, Negative, or attach file below"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Attach Diagnostic Report (PDF or Image)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setReportFileUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg p-1.5 bg-slate-50"
                />
                {reportFileUrl && (
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-emerald-600 font-medium">✓ File ready for attachment</span>
                    <button
                      type="button"
                      onClick={() => setReportFileUrl('')}
                      className="text-rose-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <input
                  type="checkbox"
                  id="abnormalFlag"
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="abnormalFlag" className="text-xs font-bold text-rose-700 cursor-pointer">
                  Mark as Abnormal (Out of biological reference range)
                </label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Technician Notes</label>
                <textarea
                  rows={2}
                  placeholder="Remarks on sample quality, method used..."
                  value={technicianRemarks}
                  onChange={(e) => setTechnicianRemarks(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResultOrder(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resultSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {resultSubmitting ? 'Saving Result...' : '✓ Finalize & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. PRINTABLE A4 REPORT MODAL */}
      {reportOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-slate-200 relative print:m-0 print:p-0 print:border-none print:shadow-none">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <button
                onClick={() => setReportOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
              <div className="flex items-center gap-2">
                {reportOrder.reportFileUrl && (
                  <a
                    href={reportOrder.reportFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    📄 View Original File
                  </a>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  🖨️ Print Report (A4)
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-blue-600 tracking-tight">
                  DrBloo<span className="text-slate-900">Medi</span> Diagnostics
                </h2>
                <p className="text-[11px] text-slate-500">Department of Pathology & Clinical Biochemistry</p>
                <p className="text-[10px] text-slate-400">Reg: LAB-MH-2026-9041 • Phone: +91 98765 43210</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Diagnostic Report</span>
                <p className="text-sm font-mono font-bold text-blue-600 mt-0.5">{reportOrder.orderNumber}</p>
                <p className="text-[10px] text-slate-400">
                  Date: {new Date(reportOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Patient Details */}
            <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Patient Details</p>
                <p className="font-bold text-slate-900 mt-0.5">{reportOrder.patient?.fullName || 'Walk-in'}</p>
                <p className="text-slate-500">Phone: {reportOrder.patient?.phone || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-slate-400">Referred By</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {reportOrder.doctor ? `Dr. ${reportOrder.doctor.user?.email?.split('@')[0]}` : 'General OPD'}
                </p>
                <p className="text-slate-500">{reportOrder.doctor?.specialization || 'Clinical Services'}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden my-6">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Investigation</th>
                  <th className="p-2.5">Observed Value</th>
                  <th className="p-2.5">Unit</th>
                  <th className="p-2.5">Reference Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-900">
                    {reportOrder.labTest?.testName}
                    <span className="block text-[10px] font-normal text-slate-400">
                      Sample: {reportOrder.labTest?.sampleType || 'Whole Blood'}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-black text-sm">
                    <span className={reportOrder.isAbnormal ? 'text-rose-600 font-black' : 'text-slate-900'}>
                      {reportOrder.resultValue || (reportOrder.reportFileUrl ? 'Refer Attached Document' : 'Pending')} {reportOrder.isAbnormal ? '*' : ''}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{reportOrder.labTest?.unit || '-'}</td>
                  <td className="p-3 font-mono text-slate-600">{reportOrder.labTest?.normalRange || 'Standard'}</td>
                </tr>
              </tbody>
            </table>

            {reportOrder.isAbnormal && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold mb-4">
                * Flagged Out of Biological Reference Range. Clinical correlation advised.
              </div>
            )}

            {reportOrder.technicianRemarks && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs my-4">
                <p className="font-bold text-slate-600 text-[10px] uppercase">Pathologist Remarks:</p>
                <p className="text-slate-800 mt-0.5">{reportOrder.technicianRemarks}</p>
              </div>
            )}

            {/* Attached file preview if it is an image */}
            {reportOrder.reportFileUrl && reportOrder.reportFileUrl.startsWith('data:image/') && (
              <div className="my-4 border border-slate-200 rounded-xl p-2 bg-slate-50">
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Attached Scan Document:</p>
                <img
                  src={reportOrder.reportFileUrl}
                  alt="Lab Report Scan"
                  className="max-h-72 w-auto mx-auto rounded object-contain"
                />
              </div>
            )}

            {/* Signatures */}
            <div className="mt-14 pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
              <div>
                <p className="font-bold text-slate-700">Lab Technician</p>
                <p>Authorized Signature</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700">Dr. Consultant Pathologist</p>
                <p>MD (Pathology) • Medical Officer</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}