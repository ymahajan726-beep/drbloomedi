'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface MedicineItem {
  name: string;
  dosage: string;
  freq: string;
  duration: string;
  notes: string;
}

export default function DoctorConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id as string;

  // Security & Session States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [doctorUser, setDoctorUser] = useState<any>(null);

  // Appointment & Patient States
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successRx, setSuccessRx] = useState<any>(null);

  // Clinical Form States
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temp: '',
    weight: '',
  });
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { name: '', dosage: '', freq: '1-0-1', duration: '5 Days', notes: 'After food' },
  ]);
  const [labTests, setLabTests] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // 1. QA/SECURITY GUARD: Check Doctor Session & Cookie
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const role = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();

    if (!token || role !== 'DOCTOR') {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  // 2. Fetch Appointment Context with QA Edge-Case Validation
  useEffect(() => {
    if (!isAuthorized || !appointmentId) return;

    async function fetchAppointmentContext() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/appointments/${appointmentId}`);
        if (!res.ok) {
          throw new Error('Appointment not found or invalid token ID');
        }
        const data = await res.json();

        // Edge case: Prevent re-consultation if already marked Completed
        if (data.status === 'COMPLETED' || data.status === 'Completed') {
          // Check if prescription already exists
          const rxRes = await fetch(`http://localhost:4000/prescriptions/appointment/${appointmentId}`);
          if (rxRes.ok) {
            const rxData = await rxRes.json();
            setSuccessRx(rxData);
          }
        }

        setAppointment(data);
      } catch (err: any) {
        setFetchError(err.message || 'Failed to load consultation session');
      } finally {
        setLoading(false);
      }
    }

    fetchAppointmentContext();
  }, [isAuthorized, appointmentId]);

  // Dynamic Medicine Row Handlers
  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', freq: '1-0-1', duration: '5 Days', notes: 'After food' }]);
  };

  const removeMedicineRow = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof MedicineItem, val: string) => {
    const updated = [...medicines];
    updated[index][field] = val;
    setMedicines(updated);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      alert('Diagnosis is strictly required to generate an E-Prescription.');
      return;
    }

    const filteredMeds = medicines.filter((m) => m.name.trim() !== '');
    if (filteredMeds.length === 0) {
      alert('Please prescribe at least one valid medication.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        appointmentId: appointment.id,
        patientId: appointment.patientId || appointment.patient?.id,
        doctorId: appointment.doctorId || appointment.doctor?.id,
        symptoms,
        diagnosis,
        vitals,
        medicines: filteredMeds,
        labTests,
        advice,
        followUpDate,
      };

      const res = await fetch('http://localhost:4000/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = resData?.message || `Server Error (${res.status})`;
        throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      }

      setSuccessRx(resData);
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving prescription');
    } finally {
      setSubmitting(false);
    }
  };

  // Guard Screen: Prevent unauthorized visual leaks
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-xs">
        🔒 Validating Doctor Consultation Security Clearances...
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading OPD Session Data...</p>
        </div>
      </div>
    );
  }

  // QA Error State
  if (fetchError || !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-rose-200 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-base font-black text-slate-900">Consultation Session Invalid</h2>
          <p className="text-xs text-slate-500">{fetchError || 'Appointment token does not exist or was removed.'}</p>
          <button
            onClick={() => router.push('/doctor/dashboard')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Return to Doctor Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PRINT VIEW: When Prescription is Completed
  // ==========================================
  if (successRx) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8">
        {/* Top Control Bar (Hidden during Print) */}
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => router.push('/doctor/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            ← Back to OPD Queue
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            🖨️ Print Prescription (A4)
          </button>
        </div>

        {/* Prescription Paper */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
            <div>
              <div className="text-2xl font-black tracking-tight text-blue-600">
                DrBloo<span className="text-slate-900">Medi</span> Hospital
              </div>
              <p className="text-xs text-slate-500 mt-1">Multi-Specialty Clinical Center • OPD Division</p>
              <p className="text-[11px] text-slate-400">License: MED-MH-2026-9921 • Contact: +91 98765 43210</p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-black text-slate-900 uppercase">Digital Prescription (Rx)</h2>
              <p className="text-xs font-bold text-blue-600 mt-1">Token #{appointment?.appointmentNumber}</p>
              <p className="text-[11px] text-slate-400">Date: {new Date(successRx.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Doctor & Patient Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patient Details</p>
              <p className="font-black text-slate-900 text-sm mt-0.5">{appointment.patient?.fullName}</p>
              <p className="text-slate-600 mt-0.5">
                Age / Gender: {appointment.patient?.age || 'N/A'} Yrs • {appointment.patient?.gender || 'N/A'}
              </p>
              <p className="text-slate-600">Contact: {appointment.patient?.phone}</p>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Consulting Physician</p>
              <p className="font-black text-slate-900 text-sm mt-0.5">{appointment.doctor?.user?.email}</p>
              <p className="text-blue-600 font-bold">{appointment.doctor?.specialization}</p>
              <p className="text-slate-500 text-[11px]">Room #{appointment.doctor?.roomNumber || 'OPD-1'}</p>
            </div>
          </div>

          {/* Patient Vitals */}
          {successRx.vitals && Object.values(successRx.vitals).some(Boolean) && (
            <div className="mb-6 flex gap-6 text-xs p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              {successRx.vitals.bp && <div><span className="font-bold text-slate-600">BP:</span> {successRx.vitals.bp} mmHg</div>}
              {successRx.vitals.pulse && <div><span className="font-bold text-slate-600">Pulse:</span> {successRx.vitals.pulse} bpm</div>}
              {successRx.vitals.temp && <div><span className="font-bold text-slate-600">Temp:</span> {successRx.vitals.temp} °F</div>}
              {successRx.vitals.weight && <div><span className="font-bold text-slate-600">Weight:</span> {successRx.vitals.weight} kg</div>}
            </div>
          )}

          {/* Diagnosis & Symptoms */}
          <div className="space-y-4 mb-8">
            {successRx.symptoms && (
              <div>
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Reported Symptoms</h4>
                <p className="text-xs text-slate-800 font-medium mt-1">{successRx.symptoms}</p>
              </div>
            )}
            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Clinical Diagnosis</h4>
              <p className="text-sm text-slate-900 font-bold mt-1">{successRx.diagnosis}</p>
            </div>
          </div>

          {/* Rx Medications Table */}
          <div className="mb-8">
            <div className="text-lg font-serif font-black text-blue-600 mb-2">℞ Medications Prescribed</div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Medicine & Strength</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {successRx.medicines.map((med: MedicineItem, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-black text-slate-900">{med.name}</span>
                      {med.dosage && <span className="ml-1.5 text-slate-500 font-mono">({med.dosage})</span>}
                    </td>
                    <td className="p-3 font-bold text-blue-600">{med.freq}</td>
                    <td className="p-3 text-slate-700">{med.duration}</td>
                    <td className="p-3 text-slate-500 italic">{med.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional Notes / Advice */}
          <div className="grid grid-cols-2 gap-6 border-t border-slate-200 pt-6 text-xs">
            <div>
              {successRx.labTests && (
                <div className="mb-4">
                  <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Recommended Lab Tests</h4>
                  <p className="text-slate-600 mt-1">{successRx.labTests}</p>
                </div>
              )}
              {successRx.advice && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Doctor Advice / Lifestyle</h4>
                  <p className="text-slate-600 mt-1">{successRx.advice}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between items-end text-right">
              {successRx.followUpDate ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-800 uppercase">Follow-up Visit Date</p>
                  <p className="text-xs font-black text-amber-900 mt-0.5">{successRx.followUpDate}</p>
                </div>
              ) : <div></div>}

              <div className="pt-12 text-center w-48 border-t border-slate-300">
                <p className="font-black text-xs text-slate-900">Dr. {appointment.doctor?.user?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400">Authorized Medical Officer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CONSULTATION FORM VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/doctor/dashboard"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold transition"
          >
            ←
          </Link>
          <div>
            <h1 className="text-base font-black text-slate-900">OPD Clinical Examination Console</h1>
            <p className="text-[11px] text-slate-400">
              Token #{appointment.appointmentNumber} • Patient: {appointment.patient?.fullName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
            ● Consultation Active
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-5xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Quick Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Patient Name</p>
              <h3 className="text-base font-black text-slate-900">{appointment.patient?.fullName}</h3>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Age / Gender</p>
              <p className="text-xs font-bold text-slate-700">
                {appointment.patient?.age || 'N/A'} Yrs • {appointment.patient?.gender || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone</p>
              <p className="text-xs font-bold text-slate-700">{appointment.patient?.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Medical History</p>
              <p className="text-xs font-medium text-slate-500 max-w-xs truncate">
                {appointment.patient?.medicalHistory || 'None reported'}
              </p>
            </div>
          </div>

          {/* Vitals Input Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Patient Vitals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pulse (bpm)</label>
                <input
                  type="text"
                  placeholder="e.g. 74"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Temperature (°F)</label>
                <input
                  type="text"
                  placeholder="e.g. 98.6"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Weight (kg)</label>
                <input
                  type="text"
                  placeholder="e.g. 68"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Clinical Symptoms & Diagnosis */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Chief Symptoms & Complains</label>
              <textarea
                rows={2}
                placeholder="Patient complains of severe headache and mild fever since 2 days..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full mt-2 p-3 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Clinical Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Viral Pharyngitis / Seasonal Infection"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full mt-2 p-3 text-xs font-bold border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Rx Medication Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Rx Prescribed Medications</h3>
              <button
                type="button"
                onClick={addMedicineRow}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition"
              >
                + Add Medication
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder="Medicine Name (e.g. Paracetamol)"
                    value={med.name}
                    onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                    className="flex-1 min-w-[160px] px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (650mg)"
                    value={med.dosage}
                    onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                    className="w-28 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  <select
                    value={med.freq}
                    onChange={(e) => updateMedicine(idx, 'freq', e.target.value)}
                    className="w-32 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none font-medium"
                  >
                    <option value="1-0-1">1-0-1 (Morning-Night)</option>
                    <option value="1-1-1">1-1-1 (Thrice a day)</option>
                    <option value="1-0-0">1-0-0 (Morning only)</option>
                    <option value="0-0-1">0-0-1 (Night only)</option>
                    <option value="SOS">SOS (As needed)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Duration (5 Days)"
                    value={med.duration}
                    onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                    className="w-28 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Notes (After food)"
                    value={med.notes}
                    onChange={(e) => updateMedicine(idx, 'notes', e.target.value)}
                    className="flex-1 min-w-[120px] px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicineRow(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lab Tests & Follow-up Plan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Recommended Lab Tests</label>
              <input
                type="text"
                placeholder="e.g. Complete Blood Count (CBC), Lipid Profile"
                value={labTests}
                onChange={(e) => setLabTests(e.target.value)}
                className="w-full mt-2 p-3 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full mt-2 p-3 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Diet & Lifestyle Advice</label>
              <textarea
                rows={2}
                placeholder="e.g. Avoid cold beverages, maintain hydration and take adequate rest."
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full mt-2 p-3 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Action Submission Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/doctor/dashboard')}
              className="px-5 py-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel & Exit
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 rounded-xl shadow-md transition flex items-center gap-2"
            >
              {submitting ? 'Generating Rx...' : '✓ Complete Examination & Generate Rx'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}