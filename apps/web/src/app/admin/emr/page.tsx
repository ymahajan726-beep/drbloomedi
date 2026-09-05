'use client';

import React, { useState, useEffect } from 'react';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  gender?: string;
  age?: number;
  bloodGroup?: string;
  address?: string;
}

interface EMRData {
  patient: Patient;
  summary: {
    totalVisits: number;
    totalPrescriptions: number;
    totalLabOrders: number;
    totalBills: number;
    totalSpent: number;
  };
  records: {
    appointments: any[];
    prescriptions: any[];
    labOrders: any[];
    billings: any[];
  };
}

export default function PatientEMRPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [emrData, setEmrData] = useState<EMRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'labs' | 'appointments' | 'bills'>('prescriptions');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. Auth Guard
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const role = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();

    if (!token || (role !== 'ADMIN' && role !== 'DOCTOR' && role !== 'RECEPTION')) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  // 2. Fetch Patients List
  useEffect(() => {
    if (!isAuthorized) return;

    fetch('http://localhost:4000/patients')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
          setSelectedPatientId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load patients', err));
  }, [isAuthorized]);

  // 3. Fetch EMR 360 Record
  const loadPatientTimeline = async (patientId: string) => {
    if (!patientId) return;
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch(`http://localhost:4000/emr/patient/${patientId}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: Failed to load timeline`);
      }
      const data = await res.json();
      setEmrData(data);
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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-xs">
        🔒 Verifying Clinical EMR Authorization...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* प्रिंट के समय साइडबार, हेडर और बटन्स को पूरी तरह हाइड करने के लिए साफ़ CSS */}
      <style>{`
        @media print {
          aside, header, nav, button, [role="navigation"] {
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

      {/* Header & Controls (Hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Patient 360° Electronic Medical Record</h1>
          <p className="text-xs text-slate-400">Aggregated Longitudinal Clinical Timeline • Diagnostic Findings • Ledger</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Patient:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:border-blue-500 shadow-sm"
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Print Full Case Dossier</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-400 print:hidden">
          Loading Patient 360° clinical summary...
        </div>
      )}

      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold print:hidden">
          ⚠️ {fetchError}.
        </div>
      )}

      {!loading && emrData && (
        <div className="space-y-6">
          {/* Official Hospital Letterhead (Always visible on print) */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-blue-600 tracking-tight">
                  DrBloo<span className="text-slate-900">Medi</span> Super-Speciality Hospital
                </h2>
                <p className="text-xs text-slate-600 font-medium">Department of Clinical Records & Medical Archival Services</p>
                <p className="text-[10px] text-slate-400">NABH & NABL Accredited • Helpline: +91 98765 43210 • info@drbloomedi.com</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Official Case Dossier</span>
                <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">UID: {emrData.patient?.id?.slice(0, 8)}</p>
                <p className="text-[10px] text-slate-400">Printed: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Patient Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6 print:border-none print:p-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md print:hidden">
                {emrData.patient?.fullName?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{emrData.patient?.fullName}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                  <span>Phone: <strong className="text-slate-800">{emrData.patient?.phone}</strong></span>
                  <span>•</span>
                  <span>Age: <strong className="text-slate-800">{emrData.patient?.age || 'N/A'} Yrs</strong></span>
                  <span>•</span>
                  <span>Gender: <strong className="text-slate-800">{emrData.patient?.gender || 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center print:border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Visits</p>
                <p className="text-base font-black text-slate-800">{emrData.summary?.totalVisits ?? 0}</p>
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center print:border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Prescriptions</p>
                <p className="text-base font-black text-blue-600">{emrData.summary?.totalPrescriptions ?? 0}</p>
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center print:border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Lab Tests</p>
                <p className="text-base font-black text-purple-600">{emrData.summary?.totalLabOrders ?? 0}</p>
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center print:border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Billed</p>
                <p className="text-base font-black text-emerald-600">₹{Number(emrData.summary?.totalSpent || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Screen view only) */}
          <div className="flex border-b border-slate-200 gap-6 text-xs font-bold print:hidden">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`pb-3 transition border-b-2 ${
                activeTab === 'prescriptions'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              💊 Prescriptions & Diagnosis ({emrData.records?.prescriptions?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('labs')}
              className={`pb-3 transition border-b-2 ${
                activeTab === 'labs'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              🔬 Lab Findings & Tests ({emrData.records?.labOrders?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`pb-3 transition border-b-2 ${
                activeTab === 'appointments'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              📅 OPD Visits ({emrData.records?.appointments?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`pb-3 transition border-b-2 ${
                activeTab === 'bills'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              💳 Billing Invoices ({emrData.records?.billings?.length || 0})
            </button>
          </div>

          {/* =========================================================
              SCREEN VIEW (Interactive Active Tab)
              ========================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px] print:hidden">
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                {(!emrData.records?.prescriptions || emrData.records.prescriptions.length === 0) ? (
                  <p className="text-center text-xs text-slate-400 py-10">No clinical prescriptions found for this patient.</p>
                ) : (
                  emrData.records.prescriptions.map((rx) => (
                    <div key={rx.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900">Dr. {rx.doctor?.user?.email?.split('@')[0] || 'Doctor'}</span>
                          <span className="text-[11px] text-slate-500 block">Diagnosis: <strong>{rx.diagnosis || 'General Clinical Review'}</strong></span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(rx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {rx.clinicalNotes && (
                        <p className="text-slate-600 text-[11px] italic bg-white p-2.5 rounded-lg border border-slate-100">
                          Notes: {rx.clinicalNotes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'labs' && (
              <div className="space-y-3">
                {(!emrData.records?.labOrders || emrData.records.labOrders.length === 0) ? (
                  <p className="text-center text-xs text-slate-400 py-10">No diagnostic orders found.</p>
                ) : (
                  emrData.records.labOrders.map((lab) => (
                    <div key={lab.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{lab.labTest?.testName || 'Diagnostic Test'}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold">
                            {lab.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Order #{lab.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        {lab.resultValue ? (
                          <span className="font-mono font-bold px-2.5 py-1 rounded text-xs bg-slate-200 text-slate-800">
                            {lab.resultValue} {lab.labTest?.unit || ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-3">
                {(!emrData.records?.appointments || emrData.records.appointments.length === 0) ? (
                  <p className="text-center text-xs text-slate-400 py-10">No OPD visit records found.</p>
                ) : (
                  emrData.records.appointments.map((apt) => (
                    <div key={apt.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">Dr. {apt.doctor?.user?.email?.split('@')[0] || 'Consultant'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{apt.reason || 'General Consultation'}</p>
                      </div>
                      <span className="font-mono text-slate-600">{apt.appointmentDate}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'bills' && (
              <div className="space-y-3">
                {(!emrData.records?.billings || emrData.records.billings.length === 0) ? (
                  <p className="text-center text-xs text-slate-400 py-10">No billing invoices found.</p>
                ) : (
                  emrData.records.billings.map((bill) => (
                    <div key={bill.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-blue-600">{bill.invoiceNumber || `INV-${bill.id}`}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Mode: {bill.paymentMethod || 'Cash'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
                          ₹{Number(bill.totalAmount || bill.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* =========================================================
              PRINT-ONLY UNIFIED DOSSIER VIEW (All Sections Collated)
              ========================================================= */}
          <div className="hidden print:block space-y-6 text-xs">
            {/* 1. Clinical Consultations & Rx Section */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px]">
                1. Clinical Consultations & Prescriptions History
              </h3>
              {emrData.records?.prescriptions?.length === 0 ? (
                <p className="text-slate-400 italic">No historical prescriptions recorded.</p>
              ) : (
                <div className="space-y-3">
                  {emrData.records.prescriptions.map((rx) => (
                    <div key={rx.id} className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Dr. {rx.doctor?.user?.email?.split('@')[0] || 'Doctor'}</span>
                        <span className="font-mono">{new Date(rx.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 mt-1">Diagnosis: <strong>{rx.diagnosis || 'Clinical Review'}</strong></p>
                      {rx.clinicalNotes && <p className="text-slate-500 italic mt-0.5">Notes: {rx.clinicalNotes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Diagnostic & Laboratory Reports Section */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px]">
                2. Pathology & Diagnostic Laboratory Reports
              </h3>
              {emrData.records?.labOrders?.length === 0 ? (
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
                    {emrData.records.labOrders.map((lab) => (
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

            {/* 3. Financial Ledger Summary Section */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-wider text-[11px]">
                3. Financial Billing Summary
              </h3>
              {emrData.records?.billings?.length === 0 ? (
                <p className="text-slate-400 italic">No financial invoices generated.</p>
              ) : (
                <table className="w-full text-left border border-slate-200 rounded">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Invoice #</th>
                      <th className="p-2 border-b">Date</th>
                      <th className="p-2 border-b">Payment Method</th>
                      <th className="p-2 border-b text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {emrData.records.billings.map((bill) => (
                      <tr key={bill.id}>
                        <td className="p-2">{bill.invoiceNumber || `INV-${bill.id}`}</td>
                        <td className="p-2">{new Date(bill.createdAt || Date.now()).toLocaleDateString()}</td>
                        <td className="p-2 font-sans">{bill.paymentMethod || 'Cash'}</td>
                        <td className="p-2 text-right font-bold">₹{Number(bill.totalAmount || bill.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Legal / Medical Officer Signatures */}
            <div className="mt-14 pt-6 border-t-2 border-slate-300 flex justify-between items-end text-[10px] text-slate-600">
              <div>
                <p className="font-bold text-slate-800">Medical Records Officer</p>
                <p>Hospital Archival Dept.</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">Chief Medical Officer (CMO)</p>
                <p>Authorized Verification Seal</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}