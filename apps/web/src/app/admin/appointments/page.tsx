'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
  };
  doctor?: {
    id: number;
    specialization: string;
    user?: { email: string };
  };
  department?: {
    id: string;
    name: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      let url = `https://drbloomedi-backend.onrender.com/appointments?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [search, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`https://drbloomedi-backend.onrender.com/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, token: string) => {
    if (!confirm(`Cancel and delete appointment ${token}?`)) return;
    
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));

    try {
      await fetch(`https://drbloomedi-backend.onrender.com/appointments/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error(err);
      loadAppointments(); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            OPD
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Appointments & OPD Consultations
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time Slot Booking, Doctor Schedule & Consultation Workflow
            </p>
          </div>
        </div>

        <Link
          href="/admin/appointments/new"
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span>
          <span>Book Appointment</span>
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Appointments
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {appointments.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">
              📅
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Scheduled / Upcoming
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {appointments.filter((a) => a.status === 'Scheduled').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base border border-amber-200 dark:border-amber-900 font-mono font-bold">
              ⏳
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Completed
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {appointments.filter((a) => a.status === 'Completed').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base border border-emerald-200 dark:border-emerald-900 font-mono font-bold">
              ✅
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by patient, token, doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-600 transition font-medium"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="text-4xl block mb-2">📅</span>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No appointments booked yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click &quot;Book Appointment&quot; to schedule a patient consultation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-3">Token / ID</th>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Doctor & Specialty</th>
                    <th className="py-3 px-3">Schedule</th>
                    <th className="py-3 px-3">Reason / Symptoms</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                          {apt.appointmentNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{apt.patient?.fullName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{apt.patient?.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {apt.doctor?.user?.email}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {apt.doctor?.specialization || 'Consultant'} • {apt.department?.name || 'General'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{apt.appointmentDate}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{apt.timeSlot}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600 dark:text-slate-300 text-[11px]">
                        {apt.symptoms || 'General Checkup'}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={apt.status}
                          onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                          className={`font-bold text-[10px] rounded-md px-2.5 py-1 border outline-none cursor-pointer ${
                            apt.status === 'Completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                              : apt.status === 'Cancelled'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                          }`}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDelete(apt.id, apt.appointmentNumber)}
                          className="px-2.5 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}