'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

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
  const { showToast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
          fetch('https://drbloomedi-backend.onrender.com/patients'),
          fetch('https://drbloomedi-backend.onrender.com/doctors'),
        ]);

        if (patientsRes.ok) {
          const pData = await patientsRes.json();

          if (Array.isArray(pData)) {
            setPatients(pData);

            if (pData.length > 0) {
              setFormData((prev) => ({
                ...prev,
                patientId: pData[0].id,
              }));
            }
          }
        }

        if (doctorsRes.ok) {
          const dData = await doctorsRes.json();

          if (Array.isArray(dData)) {
            setDoctors(dData);

            if (dData.length > 0) {
              setFormData((prev) => ({
                ...prev,
                doctorId: String(dData[0].id),
              }));
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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

      const res = await fetch(
        'https://drbloomedi-backend.onrender.com/appointments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId: formData.patientId,
            doctorId: Number(formData.doctorId),
            appointmentDate: formData.appointmentDate,
            timeSlot: formData.timeSlot.trim(),
            symptoms: formData.symptoms.trim() || undefined,
            reason: formData.reason.trim() || undefined,
          }),
        },
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message || 'Failed to schedule appointment',
        );
      }

      showToast('Appointment booked successfully!', 'success');
      router.push('/reception/dashboard');
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Error occurred while scheduling appointment',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            APT
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Schedule New Appointment
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Book clinical consultation slot
            </p>
          </div>
        </div>

        <Link
          href="/reception/dashboard"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
        >
          Back to Desk
        </Link>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-lg font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {loadingData ? (
            <div className="py-12 text-center text-xs font-medium text-slate-500 font-mono">
              Loading patients and doctors directory...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Select Patient *
                </label>

                <select
                  name="patientId"
                  required
                  value={formData.patientId}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-600 transition"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} • {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Select Consulting Doctor *
                </label>

                <select
                  name="doctorId"
                  required
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-600 transition"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName || `Doctor #${d.id}`} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                    Appointment Date *
                  </label>

                  <input
                    type="date"
                    name="appointmentDate"
                    required
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-600 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                    Time Slot *
                  </label>

                  <select
                    name="timeSlot"
                    required
                    value={formData.timeSlot}
                    onChange={handleChange}
                    className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-600 transition"
                  >
                    <option value="09:30 AM - 10:00 AM">
                      09:30 AM - 10:00 AM
                    </option>
                    <option value="10:00 AM - 10:30 AM">
                      10:00 AM - 10:30 AM
                    </option>
                    <option value="10:30 AM - 11:00 AM">
                      10:30 AM - 11:00 AM
                    </option>
                    <option value="11:00 AM - 11:30 AM">
                      11:00 AM - 11:30 AM
                    </option>
                    <option value="12:00 PM - 12:30 PM">
                      12:00 PM - 12:30 PM
                    </option>
                    <option value="02:00 PM - 02:30 PM">
                      02:00 PM - 02:30 PM
                    </option>
                    <option value="04:00 PM - 04:30 PM">
                      04:00 PM - 04:30 PM
                    </option>
                    <option value="06:00 PM - 06:30 PM">
                      06:00 PM - 06:30 PM
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Clinical Reason / Chief Complaints
                </label>

                <textarea
                  name="symptoms"
                  rows={3}
                  placeholder="e.g. Mild fever since 2 days, headache, nausea"
                  value={formData.symptoms}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-600 resize-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/reception/dashboard"
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Booking Slot...' : '✓ Book Appointment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}