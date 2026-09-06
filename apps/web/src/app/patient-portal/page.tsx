'use client';

import React, { useState } from 'react';

interface PatientProfile {
  id: string;
  fullName: string;
  phone: string;
  age?: number;
  gender?: string;
}

interface Doctor {
  id: number;
  specialization: string;
  user?: { email: string };
}

export default function PatientPortalPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'labs' | 'bills'>('appointments');
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Booking Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [bookingReason, setBookingReason] = useState('');

  // 1. Patient Login via Phone Number
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/patient-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Patient not found with this mobile number');
      }

      const data = await res.json();
      setPatient(data.patient);
      loadPatientRecords(data.patient.id);
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Load Patient Dossier & Medical Records
  const loadPatientRecords = async (patientId: string) => {
    try {
      const [aptRes, rxRes, labRes, billRes, docsRes] = await Promise.all([
        fetch(`http://localhost:4000/patient-portal/appointments/${patientId}`),
        fetch(`http://localhost:4000/patient-portal/prescriptions/${patientId}`),
        fetch(`http://localhost:4000/patient-portal/lab-reports/${patientId}`),
        fetch(`http://localhost:4000/patient-portal/bills/${patientId}`),
        fetch('http://localhost:4000/doctors'),
      ]);

      if (aptRes.ok) setAppointments(await aptRes.json());
      if (rxRes.ok) setPrescriptions(await rxRes.json());
      if (labRes.ok) setLabs(await labRes.json());
      if (billRes.ok) setBills(await billRes.json());
      if (docsRes.ok) setDoctors(await docsRes.json());
    } catch (err) {
      console.error('Error loading patient data', err);
    }
  };

  // 3. Book OPD Appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !selectedDoctorId || !appointmentDate) {
      alert('Please select doctor and appointment date');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/patient-portal/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: Number(selectedDoctorId),
          appointmentDate,
          reason: bookingReason,
        }),
      });

      if (!res.ok) throw new Error('Booking failed');

      alert('Appointment scheduled successfully!');
      setIsBookModalOpen(false);
      setSelectedDoctorId('');
      setAppointmentDate('');
      setBookingReason('');
      loadPatientRecords(patient.id);
    } catch (err: any) {
      alert(err.message || 'Error booking appointment');
    } finally {
      setLoading(false);
    }
  };

  // Login View
  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">
              Drbloo<span className="text-slate-900">Medi</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">
              Patient Self-Service Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Registered Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none font-bold tracking-wide focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition shadow-md"
            >
              {loading ? 'Verifying...' : 'Access My Medical Dossier →'}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400">
            Access digital prescriptions, diagnostic lab reports, and schedule OPD visits.
          </p>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
      {/* Top Patient Dossier Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Patient Self-Service Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">{patient.fullName}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phone: <strong className="text-slate-700">{patient.phone}</strong> • Gender: <strong className="text-slate-700">{patient.gender || 'N/A'}</strong> • Age: <strong className="text-slate-700">{patient.age || 'N/A'} Yrs</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>📅</span>
            <span>Book OPD Appointment</span>
          </button>

          <button
            onClick={() => setPatient(null)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'appointments' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          📅 My Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'prescriptions' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          💊 Digital Prescriptions ({prescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'labs' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          🔬 Diagnostic Reports ({labs.length})
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 transition border-b-2 ${
            activeTab === 'bills' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          💳 Billing Invoices ({bills.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[350px]">
        {/* 1. Appointments */}
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">No scheduled visits found.</p>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      Dr. {apt.doctor?.user?.email?.split('@')[0] || 'Doctor'}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{apt.reason || 'General Consultation'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800 block">{apt.appointmentDate}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">No prescriptions available.</p>
            ) : (
              prescriptions.map((rx) => (
                <div key={rx.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        Dr. {rx.doctor?.user?.email?.split('@')[0] || 'Consultant'}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5">Diagnosis: <strong>{rx.diagnosis || 'Clinical Assessment'}</strong></p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(rx.createdAt).toLocaleDateString()}</span>
                  </div>
                  {rx.clinicalNotes && (
                    <p className="text-slate-600 text-[11px] italic bg-white p-2.5 rounded-xl border border-slate-100">
                      Doctor Advice: {rx.clinicalNotes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. Diagnostic Reports */}
        {activeTab === 'labs' && (
          <div className="space-y-3">
            {labs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">No diagnostic test findings recorded.</p>
            ) : (
              labs.map((lab) => (
                <div key={lab.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{lab.labTest?.testName || 'Diagnostic Test'}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Order #{lab.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    {lab.resultValue ? (
                      <span className="font-mono font-bold px-2.5 py-1 rounded bg-slate-200 text-slate-800">
                        {lab.resultValue} {lab.labTest?.unit || ''}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Processing in Lab</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. Bills */}
        {activeTab === 'bills' && (
          <div className="space-y-3">
            {bills.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">No invoices recorded.</p>
            ) : (
              bills.map((b) => (
                <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600">{b.invoiceNumber || `INV-${b.id}`}</span>
                    <span className="text-[10px] text-slate-400 block">{new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      ₹{Number(b.totalAmount || b.amount || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">{b.paymentMethod || 'Paid'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Book OPD Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">Book OPD Appointment</h3>
            <form onSubmit={handleBookAppointment} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Doctor *</label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50"
                >
                  <option value="">-- Choose Specialist --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      Dr. {d.user?.email?.split('@')[0]} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chief Complaints</label>
                <textarea
                  rows={2}
                  placeholder="Fever, cough, body pain..."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

