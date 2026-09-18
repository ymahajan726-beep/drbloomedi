'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface Department {
  id: string;
  name: string;
}

export default function NewDoctorPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('https://drbloomedi-backend.onrender.com/departments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch((err) => console.error('Error fetching departments', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch('https://drbloomedi-backend.onrender.com/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password || 'Doctor@123',
          specialization: specialization.trim(),
          qualifications: qualifications.trim(),
          phone: phone.trim(),
          departmentId: departmentId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create doctor profile');
      }

      showToast('Doctor added successfully!', 'success');
      router.push('/admin/doctors');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            DOC
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Add New Doctor
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Create a doctor profile and linked login account
            </p>
          </div>
        </div>

        <Link
          href="/admin/doctors"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
        >
          Back to List
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-lg font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Doctor Full Name Input */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                Doctor Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Rajesh Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Doctor Email */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Doctor Email (Login ID) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="doctor@drbloomedi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>

              {/* 3. Password */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Account Password
                </label>
                <input
                  type="password"
                  placeholder="Default: Doctor@123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 4. Specialization */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Specialization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiologist, Pediatrician"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>

              {/* 5. Phone Number */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 6. Qualifications */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Qualifications *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBBS, MD, MS"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>

              {/* 7. Department */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
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

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin/doctors"
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {loading ? 'Creating Profile...' : '✓ Save Doctor'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}