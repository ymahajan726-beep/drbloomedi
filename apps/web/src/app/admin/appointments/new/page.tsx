'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
}

interface Doctor {
  id: number;
  specialization: string;
  user?: { email: string };
  department?: { id: string; name: string };
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    symptoms: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [patRes, docRes] = await Promise.all([
          fetch('http://localhost:4000/patients'),
          fetch('http://localhost:4000/doctors'),
        ]);

        if (patRes.ok) {
          const p = await patRes.json();
          setPatients(Array.isArray(p) ? p : []);
          if (Array.isArray(p) && p.length > 0) {
            setForm((prev) => ({ ...prev, patientId: p[0].id }));
          }
        }

        if (docRes.ok) {
          const d = await docRes.json();
          setDoctors(Array.isArray(d) ? d : []);
          if (Array.isArray(d) && d.length > 0) {
            setForm((prev) => ({ ...prev, doctorId: String(d[0].id) }));
          }
        }
      } catch (err) {
        console.error('Failed to load form dependencies', err);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch('http://localhost:4000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          doctorId: Number(form.doctorId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to book appointment');

      router.push('/admin/appointments');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Book Patient Appointment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Allocate OPD slot and link doctor specialization
          </p>
        </div>
        <Link
          href="/admin/appointments"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Back to Appointments
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Patient *
              </label>
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Doctor *
              </label>
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.email} - {d.specialization}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Time Slot *
              </label>
              <select
                value={form.timeSlot}
                onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Symptoms / Chief Complaints
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Chest discomfort, periodic fever, routine cardiac follow-up..."
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin/appointments"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              {saving ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}