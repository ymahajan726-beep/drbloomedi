'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    patientType: 'Outpatient',
    emergencyContact: '',
    medicalHistory: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://drbloomedi-backend.onrender.com/patients/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            age: data.age ? String(data.age) : '',
            gender: data.gender || 'Male',
            bloodGroup: data.bloodGroup || 'O+',
            patientType: data.patientType || 'Outpatient',
            emergencyContact: data.emergencyContact || '',
            medicalHistory: data.medicalHistory || '',
          });
        } else {
          setError('Failed to load patient details');
        }
      } catch (err) {
        setError('Network error while loading patient');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`https://drbloomedi-backend.onrender.com/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
        }),
      });

      if (res.ok) {
        router.push('/admin/patients');
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to update patient records');
      }
    } catch (err) {
      setError('An error occurred while saving records');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Loading patient edit form...
      </div>
    );
  }

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
              Edit Patient Record
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Update demographics, contact numbers, and medical history.
            </p>
          </div>
        </div>

        <Link
          href="/admin/patients"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
        >
          ← Back to Directory
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Phone Number *</label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Emergency Contact</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Age *</label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Blood Group *</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Patient Category *</label>
              <select
                name="patientType"
                value={formData.patientType}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              >
                <option value="Outpatient">Outpatient</option>
                <option value="Inpatient">Inpatient</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Allergies / Medical History</label>
            <textarea
              name="medicalHistory"
              rows={3}
              value={formData.medicalHistory}
              onChange={handleChange}
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
              {saving ? 'Saving Changes...' : 'Update Patient'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}