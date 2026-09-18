'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export default function NewPatientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    age: 28,
    gender: 'Male',
    bloodGroup: 'B+',
    patientType: 'Outpatient',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = form.phone.trim();
    if (!INDIAN_MOBILE_REGEX.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('https://drbloomedi-backend.onrender.com/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: cleanPhone,
          age: Number(form.age),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register patient');

      router.push('/admin/patients');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            PAT
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Register New Patient
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Create Patient Medical Record & Portal Access
            </p>
          </div>
        </div>

        <Link
          href="/admin/patients"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
        >
          ← Back to Patients
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            <input type="text" style={{ display: 'none' }} aria-hidden="true" />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. Ramesh Patil"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="patient@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Portal Password *
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Create patient login password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  autoComplete="off"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-mono font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Gender *
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Blood Group *
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Patient Category
                </label>
                <select
                  value={form.patientType}
                  onChange={(e) => setForm({ ...form, patientType: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                >
                  <option value="Outpatient">Outpatient (OPD)</option>
                  <option value="Inpatient">Inpatient (IPD)</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Emergency Contact (Name & Number)
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Brother: +91 9988776655"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Residential Address
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="Full home address..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Medical History / Known Allergies
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Hypertension, Diabetes, Penicillin Allergy..."
                value={form.medicalHistory}
                onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin/patients"
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {saving ? 'Registering...' : 'Save Patient'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}