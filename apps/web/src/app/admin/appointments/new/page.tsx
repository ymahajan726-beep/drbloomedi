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
  fullName?: string;
  specialization: string;
  user?: {
    email: string;
  };
}

export default function NewAppointmentPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State (timeSlot default string value set)
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    symptoms: '',
    reason: '',
  });

  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoadingData(true);
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch('http://localhost:4000/patients'),
          fetch('http://localhost:4000/doctors'),
        ]);

        if (patientsRes.ok) {
          const pData = await patientsRes.json();
          if (Array.isArray(pData)) {
            setPatients(pData);
            if (pData.length > 0) {
              setFormData((prev) => ({ ...prev, patientId: pData[0].id }));
            }
          }
        }

        if (doctorsRes.ok) {
          const dData = await doctorsRes.json();
          if (Array.isArray(dData)) {
            setDoctors(dData);
            if (dData.length > 0) {
              setFormData((prev) => ({ ...prev, doctorId: String(dData[0].id) }));
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setErrorMsg('Failed to load doctors or patients list.');
      } finally {
        setLoadingData(false);
      }
    }

    loadDropdownData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) {
      setErrorMsg('Please select a patient and a doctor.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('http://localhost:4000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          doctorId: Number(formData.doctorId),
          appointmentDate: formData.appointmentDate,
          timeSlot: formData.timeSlot.trim(),
          symptoms: formData.symptoms.trim() || undefined,
          reason: formData.reason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to schedule appointment');
      }

      alert('Appointment booked successfully!');
      router.push('/reception/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while scheduling appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Schedule New Appointment</h1>
          <p className="text-xs text-slate-500">Book clinical consultation slot</p>
        </div>
        <Link
          href="/reception/dashboard"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          Back to Desk
        </Link>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {loadingData ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400">
            Loading patients and doctors directory...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Select Patient *
              </label>
              <select
                name="patientId"
                required
                value={formData.patientId}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50 focus:border-blue-600"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} • {p.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Select Consulting Doctor *
              </label>
              <select
                name="doctorId"
                required
                value={formData.doctorId}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50 focus:border-blue-600"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || `Doctor #${d.id}`} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  name="appointmentDate"
                  required
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
                />
              </div>

              {/* Time Slot Picker */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Time Slot *
                </label>
                <select
                  name="timeSlot"
                  required
                  value={formData.timeSlot}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50 focus:border-blue-600"
                >
                  <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                  <option value="12:00 PM - 12:30 PM">12:00 PM - 12:30 PM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                  <option value="06:00 PM - 06:30 PM">06:00 PM - 06:30 PM</option>
                </select>
              </div>
            </div>

            {/* Symptoms & Clinical Reason */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Clinical Reason / Chief Complaints
              </label>
              <textarea
                name="symptoms"
                rows={3}
                placeholder="e.g. Mild fever since 2 days, headache, nausea"
                value={formData.symptoms}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-blue-600 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Link
                href="/reception/dashboard"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                {submitting ? 'Booking Slot...' : '✓ Book Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}