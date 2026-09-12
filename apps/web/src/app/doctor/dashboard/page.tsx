'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActiveToken, getAuthHeaders } from '@/utils/session';
import { performLogout } from '@/utils/logout';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';

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
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const token = getActiveToken();
    if (!token) {
      window.location.replace('/login');
      return;
    }

    const email = localStorage.getItem('doctor_email') || localStorage.getItem('userEmail') || 'Doctor';
    setDoctorEmail(email);
    setIsAuthorized(true);
    loadAppointments();
    
    const interval = setInterval(loadAppointments, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadAppointments = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/appointments`, {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        
        // FILTER: Keep only pending/scheduled/confirmed appointments in the doctor's active queue
        const activeList = list.filter((a) => {
          const st = String(a.status || '').trim().toUpperCase();
          return st === 'SCHEDULED' || st === 'CONFIRMED' || st === 'PENDING';
        });

        setAppointments(activeList);
        if (!selectedPatient && activeList.length > 0) {
          setSelectedPatient(activeList[0]);
        } else if (selectedPatient && !activeList.some(a => a.id === selectedPatient.id)) {
          setSelectedPatient(activeList[0] || null);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${BACKEND_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 font-mono text-xs">
        🔒 Verifying Doctor Clinical Credentials & Secure Session...
      </div>
    );
  }

  const pendingCount = appointments.length;

  const filteredAppointments = appointments.filter(a => {
    const q = searchFilter.toLowerCase();
    return (
      (a.patient?.fullName || '').toLowerCase().includes(q) ||
      (a.appointmentNumber || '').toLowerCase().includes(q) ||
      (a.patient?.phone || '').includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans text-slate-900 relative overflow-hidden pb-12">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <header className="bg-white backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-600/20">
            Dr
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight">
              DrBlooMedi Clinical OPD Cabin
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Specialist Physician • <span className="text-emerald-400 font-bold">{doctorEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAppointments}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition shadow-sm cursor-pointer"
          >
            🔄 Sync Queue
          </button>
          <span className="hidden sm:inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full animate-pulse">
            ● Cabin Active
          </span>
          <button
            onClick={() => performLogout('Logged out successfully.')}
            className="px-3.5 py-2 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Consultation Queue</p>
              <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</p>
            </div>
            <span className="p-3 bg-amber-50 text-amber-600 rounded-xl text-lg">⏳</span>
          </div>

          <div className="bg-white backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Patients</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{appointments.length}</p>
            </div>
            <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-lg">🩺</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white backdrop-blur-xl border border-slate-200 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Live OPD Consultation Queue
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Select a patient card to inspect EMR details</p>
              </div>
              <input
                type="text"
                placeholder="Search patient, token, phone..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full sm:w-64 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-3">Token</th>
                    <th className="py-3 px-3">Patient Name</th>
                    <th className="py-3 px-3">Slot</th>
                    <th className="py-3 px-3">Symptoms / Chief Complaints</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">Loading active OPD queue...</td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No pending consultations in queue.</td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        onClick={() => setSelectedPatient(apt)}
                        className={`cursor-pointer transition ${
                          selectedPatient?.id === apt.id ? 'bg-slate-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-3 font-mono font-bold text-blue-600">{apt.appointmentNumber}</td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          <div>{apt.patient?.fullName || 'Walk-in Patient'}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {apt.patient?.age || '25'} yrs • {apt.patient?.gender || 'N/A'} • {apt.patient?.bloodGroup || 'O+'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono">{apt.timeSlot}</td>
                        <td className="py-3.5 px-3 text-slate-600 max-w-[180px] truncate">{apt.symptoms || 'General OPD Evaluation'}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-50 text-amber-600 border border-amber-200">
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/doctor/consult/${apt.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20"
                          >
                            <span>🩺</span>
                            <span>Start Consult</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-200 flex items-center justify-between">
              <span>Active Patient EMR File</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h3>

            {selectedPatient ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{selectedPatient.patient?.fullName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Phone: {selectedPatient.patient?.phone || 'N/A'}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 font-black text-[10px] rounded-lg">
                      {selectedPatient.patient?.bloodGroup || 'O+'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200/80 flex justify-between">
                    <span><strong>Age:</strong> {selectedPatient.patient?.age || '25'} Yrs</span>
                    <span><strong>Gender:</strong> {selectedPatient.patient?.gender || 'Male'}</span>
                    <span><strong>Token:</strong> <span className="text-blue-600 font-mono">{selectedPatient.appointmentNumber}</span></span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chief Complaints / Symptoms</label>
                  <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    {selectedPatient.symptoms || 'General OPD Evaluation requested.'}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medical History & Allergies</label>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                    {selectedPatient.patient?.medicalHistory || 'No prior chronic conditions or drug allergies noted.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <Link
                    href={`/doctor/consult/${selectedPatient.id}`}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    <span>🩺</span>
                    <span>Enter Consultation Cabin →</span>
                  </Link>

                  <button
                    onClick={() => handleUpdateStatus(selectedPatient.id, 'Completed')}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold transition text-xs cursor-pointer"
                  >
                    Quick Mark as Cleared
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Select any patient from the live queue to inspect chart demographics and initiate digital E-Prescription.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}