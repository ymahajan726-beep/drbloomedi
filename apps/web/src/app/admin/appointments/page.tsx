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
      let url = `http://localhost:4000/appointments?search=${encodeURIComponent(search)}`;
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
      await fetch(`http://localhost:4000/appointments/${id}/status`, {
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
    try {
      await fetch(`http://localhost:4000/appointments/${id}`, {
        method: 'DELETE',
      });
      loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Appointments & OPD Consultations
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time Slot Booking, Doctor Schedule & Consultation Workflow
          </p>
        </div>
        <Link
          href="/admin/appointments/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Book Appointment</span>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Appointments
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {appointments.length}
            </p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">📅</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Scheduled / Upcoming
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {appointments.filter((a) => a.status === 'Scheduled').length}
            </p>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">⏳</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {appointments.filter((a) => a.status === 'Completed').length}
            </p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">✅</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by patient, token, doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50/50 outline-none"
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
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">📅</span>
            <p className="text-sm font-semibold text-slate-700">
              No appointments booked yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Book Appointment&quot; to schedule a patient consultation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Token / ID</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Doctor & Specialty</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Reason / Symptoms</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        {apt.appointmentNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{apt.patient?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{apt.patient?.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">
                        {apt.doctor?.user?.email}
                      </div>
                      <div className="text-[11px] text-blue-600">
                        {apt.doctor?.specialization || 'Consultant'} • {apt.department?.name || 'General'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{apt.appointmentDate}</div>
                      <div className="text-[11px] text-slate-500">{apt.timeSlot}</div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-600 text-[11px]">
                      {apt.symptoms || 'General Checkup'}
                    </td>
                    <td className="p-4">
                      <select
                        value={apt.status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                        className={`font-bold text-[10px] rounded-full px-2.5 py-1 border outline-none cursor-pointer ${
                          apt.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : apt.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(apt.id, apt.appointmentNumber)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
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
    </div>
  );
}