'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
    
    // Auto refresh queue every 8 seconds for live sync
    const interval = setInterval(loadAppointments, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadAppointments = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BACKEND_URL}/appointments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setAppointments(list);
        if (!selectedPatient && list.length > 0) {
          setSelectedPatient(list[0]);
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`${BACKEND_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono text-xs">
        🔒 Verifying Doctor Clinical Credentials & Secure Session...
      </div>
    );
  }

  const pendingCount = appointments.filter(
    (a) => a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'PENDING'
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === 'Completed' || a.status === 'COMPLETED'
  ).length;

  const filteredAppointments = appointments.filter(a => {
    const q = searchFilter.toLowerCase();
    return (
      (a.patient?.fullName || '').toLowerCase().includes(q) ||
      (a.appointmentNumber || '').toLowerCase().includes(q) ||
      (a.patient?.phone || '').includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-sans text-slate-100 relative overflow-hidden pb-12">
      
      {/* Background Animated Glow Accents */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-600/20">
            Dr
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight">
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
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition shadow-sm"
          >
            🔄 Sync Queue
          </button>
          <span className="hidden sm:inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full animate-pulse">
            ● Cabin Active
          </span>
          <button
            onClick={() => { if (typeof performLogout === 'function') performLogout(); else { localStorage.clear(); window.location.href = '/login'; } }}
            className="px-3.5 py-2 text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl font-bold transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Metric Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waiting Queue</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
            </div>
            <span className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-lg">⏳</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Today</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</p>
            </div>
            <span className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-lg">✅</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Scheduled</p>
              <p className="text-2xl font-black text-blue-400 mt-1">{appointments.length}</p>
            </div>
            <span className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-lg">🩺</span>
          </div>
        </div>

        {/* OPD Queue and Chart Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Queue Table (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Live OPD Consultation Queue
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Select a patient card to inspect EMR details</p>
              </div>
              <input
                type="text"
                placeholder="Search patient, token, phone..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full sm:w-64 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-3">Token</th>
                    <th className="py-3 px-3">Patient Name</th>
                    <th className="py-3 px-3">Slot</th>
                    <th className="py-3 px-3">Symptoms / Chief Complaints</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">Loading active OPD queue...</td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No patients found in queue.</td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => {
                      const isDone = apt.status === 'Completed' || apt.status === 'COMPLETED';
                      return (
                        <tr
                          key={apt.id}
                          onClick={() => setSelectedPatient(apt)}
                          className={`cursor-pointer transition ${
                            selectedPatient?.id === apt.id ? 'bg-slate-800/60 border-l-4 border-emerald-500' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">{apt.appointmentNumber}</td>
                          <td className="py-3.5 px-3 font-bold text-white">
                            <div>{apt.patient?.fullName || 'Walk-in Patient'}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {apt.patient?.age || '25'} yrs • {apt.patient?.gender || 'N/A'} • {apt.patient?.bloodGroup || 'O+'}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-slate-300 font-mono">{apt.timeSlot}</td>
                          <td className="py-3.5 px-3 text-slate-300 max-w-[180px] truncate">{apt.symptoms || 'General OPD Evaluation'}</td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                isDone
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/doctor/consult/${apt.id}`}
                              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md ${
                                isDone
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                              }`}
                            >
                              <span>{isDone ? '📄' : '🩺'}</span>
                              <span>{isDone ? 'View Rx' : 'Start Consult'}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Selected Patient Active EMR Card (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>Active Patient EMR File</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h3>

            {selectedPatient ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-white text-sm">{selectedPatient.patient?.fullName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Phone: {selectedPatient.patient?.phone || 'N/A'}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black text-[10px] rounded-lg">
                      {selectedPatient.patient?.bloodGroup || 'O+'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800/80 flex justify-between">
                    <span><strong>Age:</strong> {selectedPatient.patient?.age || '25'} Yrs</span>
                    <span><strong>Gender:</strong> {selectedPatient.patient?.gender || 'Male'}</span>
                    <span><strong>Token:</strong> <span className="text-emerald-400 font-mono">{selectedPatient.appointmentNumber}</span></span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chief Complaints / Symptoms</label>
                  <p className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
                    {selectedPatient.symptoms || 'General OPD Evaluation requested.'}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medical History & Allergies</label>
                  <p className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300">
                    {selectedPatient.patient?.medicalHistory || 'No prior chronic conditions or drug allergies noted.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <Link
                    href={`/doctor/consult/${selectedPatient.id}`}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    <span>🩺</span>
                    <span>{selectedPatient.status === 'Completed' || selectedPatient.status === 'COMPLETED' ? 'Open Digital Prescription File' : 'Enter Consultation Cabin →'}</span>
                  </Link>

                  {selectedPatient.status !== 'Completed' && selectedPatient.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedPatient.id, 'Completed')}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl font-bold transition text-xs"
                    >
                      Quick Mark as Cleared
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Select any patient from the live queue to inspect chart demographics and initiate digital E-Prescription.
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}