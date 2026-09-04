'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
}

export default function NewDoctorPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    specialization: '',
    qualifications: '',
    phone: '',
    departmentId: '',
  });

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('http://localhost:4000/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length > 0) {
            setForm((prev) => ({ ...prev, departmentId: data[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    }
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch('http://localhost:4000/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register doctor');

      router.push('/admin/doctors');
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
          <h1 className="text-2xl font-black text-slate-900">Register New Doctor</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create user credentials and link clinical specialty wing
          </p>
        </div>
        <Link
          href="/admin/doctors"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Back to Doctors
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* autoComplete="off" prevents browser auto-population */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          
          {/* Dummy inputs to deceive browser password auto-fill */}
          <input type="text" style={{ display: 'none' }} aria-hidden="true" />
          <input type="password" style={{ display: 'none' }} aria-hidden="true" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Doctor Login Email *
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="doctor@drbloomedi.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="Set password for doctor"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Specialization *
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. Cardiologist, Neurologist"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Qualifications *
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. MBBS, MD, DM"
                value={form.qualifications}
                onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                autoComplete="off"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Department Wing
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin/doctors"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              {saving ? 'Registering...' : 'Save Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}