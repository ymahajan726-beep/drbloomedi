'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  
  // Safe extraction of ID for Next.js app router
  const patientId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    age: 28,
    gender: 'Male',
    bloodGroup: 'B+',
    patientType: 'Outpatient',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
  });

  useEffect(() => {
    async function loadPatient() {
      if (!patientId) return;
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        const res = await fetch(`${BACKEND_URL}/patients/${patientId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setForm({
            fullName: data.fullName || '',
            phone: data.phone || '',
            age: data.age || 28,
            gender: data.gender || 'Male',
            bloodGroup: data.bloodGroup || 'B+',
            patientType: data.patientType || 'Outpatient',
            address: data.address || '',
            emergencyContact: data.emergencyContact || '',
            medicalHistory: data.medicalHistory || '',
          });
        } else {
          setErrorMsg('Failed to load patient dossier from database.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Network error while connecting to backend.');
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setErrorMsg('');
    setSaving(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BACKEND_URL}/patients/${patientId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update patient profile');

      router.push('/admin/patients');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center text-slate-500 font-mono text-xs">
        🔄 Loading patient dossier and health records...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 md:p-8 font-sans text-slate-900 max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Edit Patient Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">Update demographics, contact numbers, and medical history</p>
        </div>
        <Link href="/admin/patients" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
          ← Back
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-600 text-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-600 text-slate-900 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Age</label>
              <input
                type="number"
                min={1}
                max={120}
                required
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-600 text-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:border-blue-600 transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Blood Group</label>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:border-blue-600 transition"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Patient Category</label>
              <select
                value={form.patientType}
                onChange={(e) => setForm({ ...form, patientType: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 outline-none focus:border-blue-600 transition"
              >
                <option value="Outpatient">Outpatient (OPD)</option>
                <option value="Inpatient">Inpatient (IPD)</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-600 text-slate-900 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Residential Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-600 text-slate-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Medical History / Allergies</label>
            <textarea
              rows={3}
              value={form.medicalHistory}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-600 text-slate-900 transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin/patients"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
            >
              {saving ? 'Updating...' : 'Update Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}