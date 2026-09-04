'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReceptionDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'Receptionist';
    setUserEmail(email);

    async function loadTodayQueue() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`http://localhost:4000/appointments?search=${today}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching reception appointments', err);
      } finally {
        setLoading(false);
      }
    }
    loadTodayQueue();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:4000/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`http://localhost:4000/appointments?search=${today}`);
      if (res.ok) setAppointments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
            Rx
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              DrBlooMedi Front Desk
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              OPD Counter • Logged in as: {userEmail}
            </p>
          </div>
        </div>

        {/* Action & Logout Bar */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-full">
            ● Counter Active
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl font-bold transition shadow-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/patients/new"
            className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-sm transition flex items-center justify-between group"
          >
            <div>
              <p className="text-lg font-black">Register Patient</p>
              <p className="text-xs text-blue-100 mt-0.5">Quick New OPD Admission</p>
            </div>
            <span className="text-3xl group-hover:scale-110 transition-transform">👥</span>
          </Link>

          <Link
            href="/admin/appointments/new"
            className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl shadow-sm transition flex items-center justify-between group"
          >
            <div>
              <p className="text-lg font-black">Book Token</p>
              <p className="text-xs text-indigo-100 mt-0.5">Doctor Consultation Slot</p>
            </div>
            <span className="text-3xl group-hover:scale-110 transition-transform">📅</span>
          </Link>

          <Link
            href="/admin/billing/new"
            className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl shadow-sm transition flex items-center justify-between group"
          >
            <div>
              <p className="text-lg font-black">Generate Bill</p>
              <p className="text-xs text-emerald-100 mt-0.5">Cash / UPI / Card Counter</p>
            </div>
            <span className="text-3xl group-hover:scale-110 transition-transform">💳</span>
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Today&apos;s Active OPD Token Queue
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Live queue for waiting patients</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Total Tokens: {appointments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Token #</th>
                  <th className="p-3.5">Patient Name</th>
                  <th className="p-3.5">Doctor & Specialty</th>
                  <th className="p-3.5">Time Slot</th>
                  <th className="p-3.5">Queue Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Loading OPD queue...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <span className="text-3xl block mb-1">🎫</span>
                      No patients in queue right now. Click &quot;Book Token&quot; to issue a new appointment.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {apt.appointmentNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{apt.patient?.fullName}</div>
                        <div className="text-[11px] text-slate-400">{apt.patient?.phone}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{apt.doctor?.user?.email}</div>
                        <div className="text-[11px] text-blue-600 font-medium">
                          {apt.doctor?.specialization}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{apt.timeSlot}</td>
                      <td className="p-3.5">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}