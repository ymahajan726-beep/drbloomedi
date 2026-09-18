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
  const [editTest, setEditTest] = useState<LabTest | null>(null);
  const [testName, setTestName] = useState('');
  const [testPrice, setTestPrice] = useState('');
      const [testRange, setTestRange] = useState('');
      const [testUnit, setTestUnit] = useState('');
      const [testDescription, setTestDescription] = useState('');
  const [savingTest, setSavingTest] = useState(false);


      const [reportOrder, setReportOrder] = useState<LabOrder | null>(null);
      const [observedValue, setObservedValue] = useState('');
      const [remarks, setRemarks] = useState('');
        const [reportFileUrl, setReportFileUrl] = useState('');
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

      showToast(`Sample status updated to ${nextStatus}`, 'success');
      await loadData(true);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };


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
            reportFileUrl: reportFileUrl || 'https://drbloomedi-reports.local/pdf-report.pdf',
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save result');
      }

      showToast('Diagnostic lab report generated, verified & dispatched to Patient Portal!', 'success');

      setReportOrder(null);
      setObservedValue('');
      setRemarks('');
      setReportFileUrl('');
      await loadData(true);
    } catch (error: any) {
      showToast(`Report Error: ${error.message}`, 'error');
    } finally {
      setSavingReport(false);
    }
  };

  
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
    'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            LAB
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Laboratory & Pathology Portal
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sample Collection, Worklist Lifecycle, Clinical Reporting & PDF Dispatch
            </p>
          </div>
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tab === key
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {tab === 'worklist' && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Patient, Phone or Test..."
                className="max-w-md w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
              />

              <div className="flex gap-1.5 flex-wrap items-center text-xs font-semibold">
                <span className="text-slate-400">Filter:</span>

                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] transition cursor-pointer ${
                      status === s
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Requested Test</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Result</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                        Loading laboratory orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                        No matching lab orders in worklist.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {order.patient?.fullName || 'Walk-in Patient'}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {order.patient?.phone || 'No Phone'}
                          </p>
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {order.labTest?.testName || 'Pathology Test'}
                        </td>

                        <td className="py-3 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{order.labTest?.price ?? 0}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            {order.status}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {order.status === 'Completed' ? (
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {order.resultValue || '-'} {order.labTest?.unit || ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              Pending Results
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right space-x-2">
                          {order.status === 'Ordered' && (
                            <button
                              onClick={() =>
                                updateStatus(order.id, 'Sample Collected')
                              }
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                            >
                              Collect Sample
                            </button>
                          )}

                          {order.status === 'Sample Collected' && (
                            <button
                              onClick={() =>
                                updateStatus(order.id, 'In Progress')
                              }
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
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
                                setReportFileUrl(order.reportFileUrl || '');
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                            >
                              Enter Results
                            </button>
                          )}

                          {order.status === 'Completed' && (
                            <button
                              onClick={() => setViewReport(order)}
                              className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
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
        {tab === 'booking' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs max-w-xl mx-auto space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Book Laboratory Test
            </h2>

            <form onSubmit={bookTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Select Registered Patient *</label>
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Select Pathology Test *</label>
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

              <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer">
                Confirm Test Booking
              </button>
            </form>
          </div>
        )}

        {tab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ADD / EDIT FORM */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {editTest ? 'Edit Lab Test' : 'Add Test to Catalog'}
                </h2>

                {editTest && (
                  <button
                    onClick={resetTestForm}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={saveTest} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Test Name *</label>
                  <input
                    required
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Complete Blood Count"
                    className={field}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Price (₹) *</label>
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
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Reference Normal Range</label>
                  <input
                    value={testRange}
                    onChange={(e) => setTestRange(e.target.value)}
                    placeholder="13.5 - 17.5"
                    className={field}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Measurement Unit</label>
                  <input
                    value={testUnit}
                    onChange={(e) => setTestUnit(e.target.value)}
                    placeholder="g/dL"
                    className={field}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    className={`${field} resize-none`}
                  />
                </div>

                <button
                  disabled={savingTest}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer"
                >
                  {savingTest
                    ? 'Saving...'
                    : editTest
                    ? '✓ Update Lab Test'
                    : '+ Save to Master Catalog'}
                </button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Available Test Menu ({tests.length})
              </h2>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tests.length === 0 ? (
                  <p className="py-12 text-center text-slate-500 text-xs">
                    No laboratory tests found.
                  </p>
                ) : (
                  tests.map((test) => (
                    <div
                      key={test.id}
                      className="py-3.5 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {test.testName}
                        </p>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Normal Range: {test.normalRange || 'Standard'}
                          {test.unit ? ` • ${test.unit}` : ''}
                        </p>

                        {test.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                            {test.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{test.price}
                        </span>

                        <button
                          onClick={() => startEdit(test)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs"
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
      </main>

      {reportOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Enter Pathology Result & Report
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {reportOrder.labTest?.testName} • {reportOrder.patient?.fullName}
                </p>
              </div>

              <button
                onClick={() => setReportOrder(null)}
                className="w-7 h-7 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Report Document / PDF URL (Max 20MB)
                </label>

                <input
                  type="text"
                  value={reportFileUrl}
                  onChange={(e) => setReportFileUrl(e.target.value)}
                  placeholder="Paste PDF report link or scan URL (Max size 20MB)"
                  className={field}
                />
                <p className="text-[10px] text-slate-400 mt-1">Uploaded reports up to 20MB are instantly synchronized to the Patient Portal.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Technician Remarks
                </label>

                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`${field} resize-none`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportOrder(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  disabled={savingReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer"
                >
                  {savingReport ? 'Saving...' : '✓ Authorize & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  
      {viewReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  DRBLOOMEDI DIAGNOSTIC LABORATORY
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Accredited Clinical Pathology & Medical Diagnostics
                </p>
              </div>

              <button
                onClick={() => setViewReport(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Patient</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewReport.patient?.fullName || 'N/A'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {viewReport.patient?.phone || 'N/A'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Order</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewReport.orderNumber || viewReport.id.slice(0, 8)}
                </p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {new Date(viewReport.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <table className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 text-left">Investigation</th>
                  <th className="p-2.5 text-left">Observed Value</th>
                  <th className="p-2.5 text-left">Reference</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                <tr>
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                    {viewReport.labTest?.testName}
                  </td>

                  <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {viewReport.resultValue || '-'}{' '}
                    {viewReport.labTest?.unit || ''}
                  </td>

                  <td className="p-2.5 text-slate-500 dark:text-slate-400 font-mono">
                    {viewReport.labTest?.normalRange || 'Standard'}
                  </td>
                </tr>
              </tbody>
            </table>

            {viewReport.reportFileUrl && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs flex justify-between items-center border border-blue-200 dark:border-blue-900">
                <span className="font-semibold text-blue-800 dark:text-blue-300">📄 Attached Lab Report Document (Max 20MB)</span>
                <a href={viewReport.reportFileUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-[11px] shadow-2xs">View / Download PDF</a>
              </div>
            )}

            <div className="text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Technician Remarks
              </span>

              <p className="text-slate-700 dark:text-slate-300 italic font-normal">
                {viewReport.technicianRemarks ||
                  'Clinical parameters verified.'}
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs"
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}