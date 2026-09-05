'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { performLogout } from '@/utils/logout';

interface Appointment {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  symptoms: string;
  patient?: {
    id: string;
    fullName: string;
    phone: string;
    age: number;
    gender: string;
    bloodGroup: string;
    medicalHistory?: string;
  };
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // 1. SECURITY & SESSION GUARD
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

    const email = localStorage.getItem('userEmail') || 'Doctor';
    setDoctorEmail(email);
    setIsAuthorized(true);
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load doctor appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:4000/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadAppointments();
      if (selectedPatient && selectedPatient.id === id) {
        setSelectedPatient((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // अनधिकृत लोड से बचाव
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-xs">
        🔒 Verifying Doctor Clinical Credentials...
      </div>
    );
  }

  const pendingCount = appointments.filter(
    (a) => a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'PENDING'
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === 'Completed' || a.status === 'COMPLETED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
            Dr
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              DrBlooMedi Clinical OPD
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Consultation Room • {doctorEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-full">
            ● Consultation Active
          </span>
          <button
            onClick={performLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl font-bold transition shadow-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metric Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Waiting Queue</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <span className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">⏳</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Today</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
            </div>
            <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">✅</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Consultations</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{appointments.length}</p>
            </div>
            <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">🩺</span>
          </div>
        </div>

        {/* OPD Queue and Chart Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Queue Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Patient OPD Consultation Queue
              </h2>
              <span className="text-[11px] text-slate-400">Click a patient to inspect chart</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Token</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Slot</th>
                    <th className="p-3.5">Symptoms</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Consultation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Loading appointments...</td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">No patients scheduled.</td>
                    </tr>
                  ) : (
                    appointments.map((apt) => {
                      const isDone = apt.status === 'Completed' || apt.status === 'COMPLETED';
                      return (
                        <tr
                          key={apt.id}
                          onClick={() => setSelectedPatient(apt)}
                          className={`cursor-pointer transition ${
                            selectedPatient?.id === apt.id ? 'bg-blue-50/80' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="p-3.5 font-mono font-bold text-blue-600">{apt.appointmentNumber}</td>
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>{apt.patient?.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {apt.patient?.age} yrs • {apt.patient?.gender} • {apt.patient?.bloodGroup}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{apt.timeSlot}</td>
                          <td className="p-3.5 text-slate-600 max-w-xs truncate">{apt.symptoms || 'General Checkup'}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isDone
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : apt.status === 'Cancelled'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            {isDone ? (
                              <Link
                                href={`/doctor/consult/${apt.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 rounded-xl font-bold text-[11px] transition shadow-sm"
                              >
                                <span>📄</span>
                                <span>View Rx</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/doctor/consult/${apt.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] transition shadow-sm"
                              >
                                <span>🩺</span>
                                <span>Start Consult</span>
                              </Link>
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

          {/* Right: Selected Patient Details Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Active Patient EMR File
            </h3>

            {selectedPatient ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{selectedPatient.patient?.fullName}</h4>
                      <p className="text-xs text-slate-500">{selectedPatient.patient?.phone}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 font-black text-xs rounded-lg">
                      {selectedPatient.patient?.bloodGroup}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 flex gap-4">
                    <span><strong>Age:</strong> {selectedPatient.patient?.age}</span>
                    <span><strong>Gender:</strong> {selectedPatient.patient?.gender}</span>
                    <span><strong>Token:</strong> {selectedPatient.appointmentNumber}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Chief Complaints</label>
                  <p className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800">
                    {selectedPatient.symptoms || 'None recorded at front-desk.'}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Known Allergies / History</label>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    {selectedPatient.patient?.medicalHistory || 'No prior conditions noted.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <Link
                    href={`/doctor/consult/${selectedPatient.id}`}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>🩺</span>
                    <span>{selectedPatient.status === 'Completed' || selectedPatient.status === 'COMPLETED' ? 'Open Digital Rx File' : 'Start E-Prescription'}</span>
                  </Link>

                  {selectedPatient.status !== 'Completed' && selectedPatient.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedPatient.id, 'Completed')}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold transition"
                    >
                      Quick Mark as Cleared
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select any patient from the queue to view demographics and consultation details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}