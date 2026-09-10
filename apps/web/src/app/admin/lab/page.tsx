'use client';

import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../../../utils/session';
import { useToast } from '@/components/Toast';

const API = 'https://drbloomedi-backend.onrender.com';

interface LabTest {
  id: string;
  testName: string;
  price: number;
  normalRange?: string;
  unit?: string;
  description?: string;
}

interface LabOrder {
  id: string;
  orderNumber?: string;
  status: string;
  resultValue?: string;
  technicianRemarks?: string;
  reportFileUrl?: string;
  createdAt: string;
  patient?: {
    id: string;
    fullName: string;
    phone: string;
    age?: number;
    gender?: string;
  };
  labTest?: LabTest;
}

const STATUSES = [
  'ALL',
  'Ordered',
  'Sample Collected',
  'In Progress',
  'Completed',
  'Cancelled',
];

export default function LaboratoryManagementPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'worklist' | 'catalog' | 'booking'>('worklist');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const [patientId, setPatientId] = useState('');
  const [testId, setTestId] = useState('');

  // Add / Edit test
  const [editTest, setEditTest] = useState<LabTest | null>(null);
  const [testName, setTestName] = useState('');
  const [testPrice, setTestPrice] = useState('');
  const [testRange, setTestRange] = useState('');
  const [testUnit, setTestUnit] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [savingTest, setSavingTest] = useState(false);

  // Report
  const [reportOrder, setReportOrder] = useState<LabOrder | null>(null);
  const [observedValue, setObservedValue] = useState('');
  const [remarks, setRemarks] = useState('');
  const [savingReport, setSavingReport] = useState(false);
  const [viewReport, setViewReport] = useState<LabOrder | null>(null);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(true), 5000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (background = false) => {
    try {
      if (!background) setLoading(true);

      const headers = getAuthHeaders();

      const [ordersRes, testsRes, patientsRes] = await Promise.all([
        fetch(`${API}/lab/orders`, { headers, credentials: 'include' }),
        fetch(`${API}/lab/tests`, { headers, credentials: 'include' }),
        fetch(`${API}/patients`, { headers, credentials: 'include' }),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(Array.isArray(data) ? data : []);
      }

      if (testsRes.ok) {
        const data = await testsRes.json();
        setTests(Array.isArray(data) ? data : []);
      }

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Laboratory data error:', error);
    } finally {
      if (!background) setLoading(false);
    }
  };

  // ---------------- STATUS ----------------

  const updateStatus = async (id: string, nextStatus: string) => {
    try {
      const res = await fetch(`${API}/lab/orders/${id}/sample-status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Status update failed');
      }

      await loadData(true);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  // ---------------- REPORT ----------------

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportOrder) return;

    try {
      setSavingReport(true);

      const res = await fetch(
        `${API}/lab/orders/${reportOrder.id}/report`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            observedValue,
            remarks,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save result');
      }

      showToast('Diagnostic lab report generated and verified!', 'success');

      setReportOrder(null);
      setObservedValue('');
      setRemarks('');
      await loadData(true);
    } catch (error: any) {
      showToast(`Report Error: ${error.message}`, 'error');
    } finally {
      setSavingReport(false);
    }
  };

  // ---------------- BOOK TEST ----------------

  const bookTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !testId) {
      showToast('Please select both patient and lab test', 'error');
      return;
    }

    try {
      const res = await fetch(`${API}/lab/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          patientId,
          labTestId: testId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to book test');
      }

      showToast('Lab test booked successfully in the worklist!', 'success');

      setPatientId('');
      setTestId('');
      setTab('worklist');
      await loadData(true);
    } catch (error: any) {
      showToast(`Booking Error: ${error.message}`, 'error');
    }
  };

  // ---------------- ADD / EDIT TEST ----------------

  const resetTestForm = () => {
    setEditTest(null);
    setTestName('');
    setTestPrice('');
    setTestRange('');
    setTestUnit('');
    setTestDescription('');
  };

  const startEdit = (test: LabTest) => {
    setEditTest(test);
    setTestName(test.testName);
    setTestPrice(String(test.price ?? ''));
    setTestRange(test.normalRange || '');
    setTestUnit(test.unit || '');
    setTestDescription(test.description || '');
    setTab('catalog');
  };

  const saveTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testName.trim() || !testPrice) {
      showToast('Test name and price are required', 'error');
      return;
    }

    try {
      setSavingTest(true);

      const payload = {
        testName: testName.trim(),
        price: Number(testPrice),
        normalRange: testRange.trim(),
        unit: testUnit.trim(),
        description: testDescription.trim(),
      };

      const url = editTest
        ? `${API}/lab/tests/${editTest.id}`
        : `${API}/lab/tests`;

      const res = await fetch(url, {
        method: editTest ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            (editTest
              ? 'Failed to update lab test'
              : 'Failed to create lab test')
        );
      }

      showToast(editTest
        ? 'Lab Test Updated Successfully!'
        : 'Master Lab Test Added to Catalog!',
        'success'
      );

      resetTestForm();
      await loadData(true);
    } catch (error: any) {
      showToast(`Catalog Error: ${error.message}`, 'error');
    } finally {
      setSavingTest(false);
    }
  };

  // ---------------- FILTER ----------------

  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase();

    const name = order.patient?.fullName?.toLowerCase() || '';
    const phone = order.patient?.phone || '';
    const test = order.labTest?.testName?.toLowerCase() || '';

    const matchesSearch =
      name.includes(q) ||
      phone.includes(q) ||
      test.includes(q);

    const matchesStatus =
      status === 'ALL' || order.status === status;

    return matchesSearch && matchesStatus;
  });

  const field =
    'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full uppercase">
            Module 8 • Diagnostics
          </span>

          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Laboratory & Pathology Portal
          </h1>

          <p className="text-xs text-slate-500">
            Sample Collection, Worklist Lifecycle, Clinical Reporting & PDF Dispatch
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            ['worklist', '📋 Worklist Orders'],
            ['booking', '+ Book Test'],
            ['catalog', '🧪 Test Catalog'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                tab === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* WORKLIST */}
      {tab === 'worklist' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Patient, Phone or Test..."
              className="max-w-md w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
            />

            <div className="flex gap-2 flex-wrap items-center text-xs font-bold">
              <span className="text-slate-400">Filter:</span>

              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 rounded-xl ${
                    status === s
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Requested Test</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      Loading laboratory orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      No matching lab orders in worklist.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">
                          {order.patient?.fullName || 'Walk-in Patient'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {order.patient?.phone || 'No Phone'}
                        </p>
                      </td>

                      <td className="py-3 px-4 font-bold">
                        {order.labTest?.testName || 'Pathology Test'}
                      </td>

                      <td className="py-3 px-4 font-black">
                        ₹{order.labTest?.price ?? 0}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {order.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {order.status === 'Completed' ? (
                          <span className="font-mono font-bold text-purple-700">
                            {order.resultValue || '-'} {order.labTest?.unit || ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Pending Results
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">

                        {order.status === 'Ordered' && (
                          <button
                            onClick={() =>
                              updateStatus(order.id, 'Sample Collected')
                            }
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold"
                          >
                            Collect Sample
                          </button>
                        )}

                        {order.status === 'Sample Collected' && (
                          <button
                            onClick={() =>
                              updateStatus(order.id, 'In Progress')
                            }
                            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold"
                          >
                            Send to Analyzer
                          </button>
                        )}

                        {(order.status === 'Sample Collected' ||
                          order.status === 'In Progress') && (
                          <button
                            onClick={() => {
                              setReportOrder(order);
                              setObservedValue(order.resultValue || '');
                              setRemarks(order.technicianRemarks || '');
                            }}
                            className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[11px] font-bold"
                          >
                            Enter Results
                          </button>
                        )}

                        {order.status === 'Completed' && (
                          <button
                            onClick={() => setViewReport(order)}
                            className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold"
                          >
                            🖨️ Report
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
      )}

      {/* BOOKING */}
      {tab === 'booking' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">

          <h2 className="text-sm font-black uppercase mb-5">
            Book Laboratory Test
          </h2>

          <form onSubmit={bookTest} className="space-y-4 text-xs">

            <div>
              <label className="label">Select Registered Patient *</label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className={field}
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Select Pathology Test *</label>
              <select
                required
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                className={field}
              >
                <option value="">-- Choose Lab Test --</option>
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.testName} - ₹{t.price}
                  </option>
                ))}
              </select>
            </div>

            <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">
              Confirm Test Booking
            </button>

          </form>
        </div>
      )}

      {/* CATALOG */}
      {tab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ADD / EDIT FORM */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-black uppercase">
                {editTest ? 'Edit Lab Test' : 'Add Test to Catalog'}
              </h2>

              {editTest && (
                <button
                  onClick={resetTestForm}
                  className="text-xs font-bold text-slate-500"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={saveTest} className="space-y-3 text-xs">

              <div>
                <label className="label">Test Name *</label>
                <input
                  required
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Complete Blood Count"
                  className={field}
                />
              </div>

              <div>
                <label className="label">Price (₹) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={testPrice}
                  onChange={(e) => setTestPrice(e.target.value)}
                  className={field}
                />
              </div>

              <div>
                <label className="label">Reference Normal Range</label>
                <input
                  value={testRange}
                  onChange={(e) => setTestRange(e.target.value)}
                  placeholder="13.5 - 17.5"
                  className={field}
                />
              </div>

              <div>
                <label className="label">Measurement Unit</label>
                <input
                  value={testUnit}
                  onChange={(e) => setTestUnit(e.target.value)}
                  placeholder="g/dL"
                  className={field}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={2}
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className={field}
                />
              </div>

              <button
                disabled={savingTest}
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-bold"
              >
                {savingTest
                  ? 'Saving...'
                  : editTest
                  ? '✓ Update Lab Test'
                  : '+ Save to Master Catalog'}
              </button>

            </form>
          </div>

          {/* TEST LIST */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">

            <h2 className="text-sm font-black uppercase mb-4">
              Available Test Menu
            </h2>

            <div className="divide-y divide-slate-100">

              {tests.length === 0 ? (
                <p className="py-8 text-center text-slate-400 text-xs">
                  No laboratory tests found.
                </p>
              ) : (
                tests.map((test) => (
                  <div
                    key={test.id}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {test.testName}
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Normal Range: {test.normalRange || 'Standard'}
                        {test.unit ? ` • ${test.unit}` : ''}
                      </p>

                      {test.description && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {test.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-purple-700">
                        ₹{test.price}
                      </span>

                      {/* EDIT */}
                      <button
                        onClick={() => startEdit(test)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold hover:bg-blue-100"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>
        </div>
      )}

      {/* REPORT ENTRY MODAL */}
      {reportOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">

            <div className="flex justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-black">
                  Enter Pathology Result
                </h3>

                <p className="text-[11px] text-slate-500">
                  {reportOrder.labTest?.testName} •{' '}
                  {reportOrder.patient?.fullName}
                </p>
              </div>

              <button
                onClick={() => setReportOrder(null)}
                className="w-7 h-7 bg-slate-100 rounded-full font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitReport} className="space-y-3 text-xs">

              <div>
                <label className="label">
                  Observed Value ({reportOrder.labTest?.unit || 'Units'}) *
                </label>

                <input
                  required
                  value={observedValue}
                  onChange={(e) => setObservedValue(e.target.value)}
                  placeholder={`Ref: ${
                    reportOrder.labTest?.normalRange || 'Standard'
                  }`}
                  className={field}
                />
              </div>

              <div>
                <label className="label">
                  Technician Remarks
                </label>

                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={field}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={() => setReportOrder(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>

                <button
                  disabled={savingReport}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold"
                >
                  {savingReport ? 'Saving...' : '✓ Authorize & Complete'}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT VIEW */}
      {viewReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl">

            <div className="border-b-2 border-slate-900 pb-4 flex justify-between">
              <div>
                <h2 className="text-xl font-black">
                  DRBLOOMEDI DIAGNOSTIC LABORATORY
                </h2>
                <p className="text-[11px] text-slate-500">
                  Accredited Clinical Pathology & Medical Diagnostics
                </p>
              </div>

              <button
                onClick={() => setViewReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl my-5">
              <div>
                <span className="small-label">Patient</span>
                <p className="font-bold">
                  {viewReport.patient?.fullName || 'N/A'}
                </p>
                <p className="text-slate-500">
                  {viewReport.patient?.phone || 'N/A'}
                </p>
              </div>

              <div className="text-right">
                <span className="small-label">Order</span>
                <p className="font-mono font-bold">
                  {viewReport.orderNumber || viewReport.id.slice(0, 8)}
                </p>
                <p className="text-slate-500">
                  {new Date(viewReport.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <table className="w-full text-xs border border-slate-100">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">Investigation</th>
                  <th className="p-3 text-left">Observed Value</th>
                  <th className="p-3 text-left">Reference</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="p-3 font-bold">
                    {viewReport.labTest?.testName}
                  </td>

                  <td className="p-3 font-mono font-black text-purple-700">
                    {viewReport.resultValue || '-'}{' '}
                    {viewReport.labTest?.unit || ''}
                  </td>

                  <td className="p-3 text-slate-500">
                    {viewReport.labTest?.normalRange || 'Standard'}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-xs bg-purple-50 p-3 rounded-xl mt-4">
              <span className="small-label">
                Technician Remarks
              </span>

              <p className="text-slate-700 italic">
                {viewReport.technicianRemarks ||
                  'Clinical parameters verified.'}
              </p>
            </div>

            <div className="flex justify-end pt-5 mt-5 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                🖨️ Print / Save PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SMALL LOCAL STYLES */}
      <style jsx>{`
        .label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .small-label {
          display: block;
          font-size: 10px;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
      `}</style>

    </div>
  );
}