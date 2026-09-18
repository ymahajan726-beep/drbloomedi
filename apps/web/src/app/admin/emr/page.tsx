'use client';

import React, { useState, useEffect } from 'react';
import { getActiveToken, getAuthHeaders } from '@/utils/session';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  gender?: string;
  age?: number;
  bloodGroup?: string;
  address?: string;
}

export default function PatientEMRPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientData, setPatientData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'labs' | 'appointments' | 'bills'>('prescriptions');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const token = getActiveToken();
    const role = sessionStorage.getItem('userRole')?.toUpperCase();

    if (!token || (role !== 'ADMIN' && role !== 'DOCTOR' && role !== 'RECEPTION')) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  const fetchPatients = async (query = '') => {
    try {
      const url = query.trim()
        ? `https://drbloomedi-backend.onrender.com/patients?search=${encodeURIComponent(query.trim())}`
        : 'https://drbloomedi-backend.onrender.com/patients';

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setPatients(list);
        if (list.length > 0 && (!selectedPatientId || !list.some((p) => p.id === selectedPatientId))) {
          setSelectedPatientId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchPatients();
    }
  }, [isAuthorized]);

  const loadPatientTimeline = async (patientId: string) => {
    if (!patientId) return;
    try {
      setLoading(true);
      setFetchError(null);

      const res = await fetch(
        `https://drbloomedi-backend.onrender.com/emr/patient/${patientId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: Failed to load timeline`);
      }

      const data = await res.json();
      setPatientData(data);
    } catch (err: any) {
      console.error('EMR load error:', err);
      setFetchError(err.message || 'Could not fetch patient record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientTimeline(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(searchQuery);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 font-mono text-xs">
        🔒 Verifying Clinical EMR Authorization...
      </div>
    );
  }

  const patient = patientData?.patient || patientData;
  const stats = patientData?.stats || {
    totalVisits: patientData?.appointments?.length || 0,
    totalInvoiced: (patientData?.billings || []).reduce((acc: number, b: any) => acc + Number(b.totalAmount || b.amount || 0), 0),
    totalPaid: (patientData?.billings || []).filter((b: any) => b.paymentStatus === 'PAID').reduce((acc: number, b: any) => acc + Number(b.totalAmount || b.amount || 0), 0),
    outstandingBalance: 0,
  };

  const prescriptions = patientData?.prescriptions || patient?.prescriptions || [];
  const labOrders = patientData?.labOrders || patient?.labOrders || [];
  const appointments = patientData?.appointments || patient?.appointments || [];
  const billings = patientData?.billings || patientData?.bills || patient?.billings || [];

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      <style>{`
        @media print {
          aside, header, nav, button, [role="navigation"], form, select, input {
            display: none !important;
          }
          body {
            background: white !important;
          }
          @page {
            size: A4;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            EMR
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Patient 360° Electronic Medical Record
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Aggregated Longitudinal Clinical Timeline • Diagnostic Findings • Ledger
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
       
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Search Name / Mobile..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === '') fetchPatients('');
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 font-medium transition"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition max-w-[200px]"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} • {p.phone}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Print Dossier</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {loading && (
          <div className="p-12 text-center text-xs text-slate-500 font-mono print:hidden">
            Loading Patient 360° clinical summary...
          </div>
        )}

        {fetchError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold print:hidden">
            ⚠️ {fetchError}.
          </div>
        )}

        {!loading && patient && (
          <div className="space-y-6">
            {/* Print Letterhead */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-600 tracking-tight">
                    DrBloo<span className="text-slate-900">Medi</span> Super-Speciality Hospital
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">Department of Clinical Records & Medical Archival Services</p>
                  <p className="text-[10px] text-slate-400">NABH & NABL Accredited • Helpline: +91 98765 43210</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Official Case Dossier</span>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">UID: {patient.id?.slice(0, 8)}</p>
                  <p className="text-[10px] text-slate-400">Printed: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Patient Overview Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-6 print:border-none print:p-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs print:hidden">
                  {patient.fullName?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{patient.fullName}</h2>
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>Phone: <strong className="text-slate-700 dark:text-slate-200 font-mono">{patient.phone}</strong></span>
                    <span>•</span>
                    <span>Age: <strong className="text-slate-700 dark:text-slate-200">{patient.age || 'N/A'} Yrs</strong></span>
                    <span>•</span>
                    <span>Gender: <strong className="text-slate-700 dark:text-slate-200">{patient.gender || 'N/A'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Aggregated Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Visits</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">{stats.totalVisits ?? appointments.length}</p>
                </div>
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Prescriptions</p>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">{prescriptions.length}</p>
                </div>
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Lab Tests</p>
                  <p className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5">{labOrders.length}</p>
                </div>
                <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Invoiced</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">₹{Number(stats.totalInvoiced || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold print:hidden">
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  activeTab === 'prescriptions'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                💊 Prescriptions & Diagnosis ({prescriptions.length})
              </button>

              <button
                onClick={() => setActiveTab('labs')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  activeTab === 'labs'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                🔬 Lab Findings & Tests ({labOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('appointments')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  activeTab === 'appointments'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                📅 OPD Visits ({appointments.length})
              </button>

              <button
                onClick={() => setActiveTab('bills')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  activeTab === 'bills'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                💳 Billing Invoices ({billings.length})
              </button>
            </div>

            {/* Interactive Active Tab */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs min-h-[300px] print:hidden">
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {prescriptions.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-12">No clinical prescriptions found for this patient.</p>
                  ) : (
                    prescriptions.map((rx: any) => (
                      <div key={rx.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">Dr. {rx.doctor?.user?.email?.split('@')[0] || 'Doctor'}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Diagnosis: <strong className="text-slate-800 dark:text-slate-200">{rx.diagnosis || 'General Clinical Review'}</strong></span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(rx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {rx.advice && (
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] italic bg-white dark:bg-slate-900 p-2.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                            Advice: {rx.advice}
                          </p>
                        )}
                        {rx.medicines && Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] mb-1">Medicines Prescribed:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {rx.medicines.map((m: any, idx: number) => (
                                <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded text-[11px] font-medium border border-emerald-200 dark:border-emerald-900">
                                  {m.medicineName} ({m.dosage || m.frequency})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'labs' && (
                <div className="space-y-3">
                  {labOrders.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-12">No diagnostic orders found.</p>
                  ) : (
                    labOrders.map((lab: any) => (
                      <div key={lab.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{lab.labTest?.testName || 'Diagnostic Test'}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              lab.status === 'Completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {lab.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Order #{lab.orderNumber}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {lab.resultValue ? (
                              <span className={`font-mono font-bold px-2.5 py-1 rounded text-xs ${
                                lab.isAbnormal ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                              }`}>
                                {lab.resultValue} {lab.labTest?.unit || ''} {lab.isAbnormal ? '⚠️' : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Pending Results</span>
                            )}
                          </div>

                          {lab.reportFileUrl && (
                            <a
                              href={lab.reportFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>📄</span>
                              <span>View Report</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  {appointments.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-12">No OPD visit records found.</p>
                  ) : (
                    appointments.map((apt: any) => (
                      <div key={apt.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Dr. {apt.doctor?.user?.email?.split('@')[0] || 'Consultant'}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{apt.reason || 'General Consultation'}</p>
                        </div>
                        <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{apt.appointmentDate}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'bills' && (
                <div className="space-y-3">
                  {billings.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-12">No billing invoices found.</p>
                  ) : (
                    billings.map((bill: any) => (
                      <div key={bill.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{bill.invoiceNumber || `INV-${bill.id}`}</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Mode: {bill.paymentMethod || 'Cash'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono block">
                            ₹{Number(bill.totalAmount || bill.amount || 0).toFixed(2)}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block mt-0.5 ${bill.paymentStatus === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900'}`}>
                            {bill.paymentStatus || 'UNPAID'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Printable Unified Dossier */}
            <div className="hidden print:block space-y-6 text-xs">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px]">
                  1. Clinical Consultations & Prescriptions History
                </h3>
                {prescriptions.length === 0 ? (
                  <p className="text-slate-400 italic">No historical prescriptions recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((rx: any) => (
                      <div key={rx.id} className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>Dr. {rx.doctor?.user?.email?.split('@')[0] || 'Doctor'}</span>
                          <span className="font-mono">{new Date(rx.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 mt-1">Diagnosis: <strong>{rx.diagnosis || 'Clinical Review'}</strong></p>
                        {rx.advice && <p className="text-slate-500 italic mt-0.5">Advice: {rx.advice}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px]">
                  2. Pathology & Diagnostic Laboratory Reports
                </h3>
                {labOrders.length === 0 ? (
                  <p className="text-slate-400 italic">No lab findings on record.</p>
                ) : (
                  <table className="w-full text-left border border-slate-200 rounded">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 border-b">Order #</th>
                        <th className="p-2 border-b">Test Name</th>
                        <th className="p-2 border-b">Observed Value</th>
                        <th className="p-2 border-b">Normal Range</th>
                        <th className="p-2 border-b">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {labOrders.map((lab: any) => (
                        <tr key={lab.id}>
                          <td className="p-2">{lab.orderNumber}</td>
                          <td className="p-2 font-sans font-bold">{lab.labTest?.testName}</td>
                          <td className="p-2 font-bold">{lab.resultValue || 'Awaiting'} {lab.labTest?.unit || ''}</td>
                          <td className="p-2 text-slate-500">{lab.labTest?.normalRange || '-'}</td>
                          <td className="p-2 font-sans">{lab.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px]">
                  3. Financial & Invoicing Summary
                </h3>
                <div className="p-3 border border-slate-200 rounded-lg flex justify-between">
                  <span>Total Invoiced: <strong>₹{Number(stats.totalInvoiced || 0).toFixed(2)}</strong></span>
                  <span>Settled: <strong className="text-emerald-700">₹{Number(stats.totalPaid || 0).toFixed(2)}</strong></span>
                  <span>Outstanding: <strong className="text-rose-700">₹{Number(stats.outstandingBalance || 0).toFixed(2)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}