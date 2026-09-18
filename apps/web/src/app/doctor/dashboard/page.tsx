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
  const [isSyncing, setIsSyncing] = useState(false);
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

    setIsAuthorized(true);
    initializeDoctorSession();
    
    const interval = setInterval(() => initializeDoctorSession(false), 12000);
    return () => clearInterval(interval);
  }, []);

  const initializeDoctorSession = async (showLoader = true) => {
    if (showLoader) setIsSyncing(true);
    try {
      const headers = getAuthHeaders();
      let doctorId: string | number | null = null;

      const profileRes = await fetch(`${BACKEND_URL}/doctors/profile/me`, {
        headers,
      });

      if (profileRes.ok) {
        const doctorProfile = await profileRes.json();
        if (doctorProfile && doctorProfile.id) {
          doctorId = doctorProfile.id;
          if (doctorProfile.user?.email) {
            setDoctorEmail(doctorProfile.user.email);
          }
        }
      }

      await loadAppointments(doctorId);
    } catch (err) {
      console.error('Session initialization error:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const loadAppointments = async (doctorId: number | string | null) => {
    try {
      if (!doctorId) {
        setAppointments([]);
        return;
      }

      const headers = getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/appointments?doctorId=${doctorId}`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        
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
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`${BACKEND_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      initializeDoctorSession(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 font-mono text-xs">
        Verifying secure clinical credentials...
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
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            DR
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Clinical OPD Cabin
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Specialist Physician • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{doctorEmail || 'doctor@hospital.com'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => initializeDoctorSession(true)}
            disabled={isSyncing}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span className={`inline-block ${isSyncing ? 'animate-spin' : ''}`}>↻</span> 
            {isSyncing ? 'Syncing...' : 'Sync Queue'}
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[11px] font-semibold rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Cabin Active
          </div>

          <button
            onClick={() => performLogout('Logged out successfully.')}
            className="px-3.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Consultation Queue</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base border border-amber-200 dark:border-amber-900 font-mono font-bold">
              {pendingCount}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Active Patients</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{appointments.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">
              {appointments.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Queue Table */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Consultation Queue
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Click any patient row to inspect file details</p>
              </div>
              <input
                type="text"
                placeholder="Search token, name, phone..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full sm:w-60 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[580px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Slot</th>
                    <th className="py-2.5 px-3">Symptoms</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">Syncing queue data...</td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">No pending consultations found.</td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        onClick={() => setSelectedPatient(apt)}
                        className={`cursor-pointer transition-colors ${
                          selectedPatient?.id === apt.id 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-3 border-emerald-600' 
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{apt.appointmentNumber}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          <div>{apt.patient?.fullName || 'Walk-in Patient'}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {apt.patient?.age || '25'} yrs • {apt.patient?.gender || 'N/A'} • {apt.patient?.bloodGroup || 'O+'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">{apt.timeSlot}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[150px] truncate">{apt.symptoms || 'General Evaluation'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/doctor/consult/${apt.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                          >
                            <span>Consult</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Patient EMR File</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </h3>

            {selectedPatient ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedPatient.patient?.fullName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Tel: {selectedPatient.patient?.phone || 'N/A'}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-[10px] rounded-md">
                      {selectedPatient.patient?.bloodGroup || 'O+'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/80 dark:border-slate-700 flex justify-between">
                    <span>Age: <strong className="text-slate-900 dark:text-white">{selectedPatient.patient?.age || '25'}</strong></span>
                    <span>Gender: <strong className="text-slate-900 dark:text-white">{selectedPatient.patient?.gender || 'Male'}</strong></span>
                    <span>Token: <strong className="font-mono text-blue-600 dark:text-blue-400">{selectedPatient.appointmentNumber}</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chief Complaints</label>
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-amber-900 dark:text-amber-300 font-medium">
                    {selectedPatient.symptoms || 'General OPD Evaluation requested.'}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Medical History</label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                    {selectedPatient.patient?.medicalHistory || 'No prior chronic conditions or drug allergies noted.'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Link
                    href={`/doctor/consult/${selectedPatient.id}`}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>Open Consultation Cabin →</span>
                  </Link>

                  <button
                    onClick={() => handleUpdateStatus(selectedPatient.id, 'Completed')}
                    className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold transition text-xs cursor-pointer"
                  >
                    Mark as Cleared
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-slate-500 text-xs">
                Select any patient record from the queue to review medical data.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}