'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { getAuthHeaders } from '@/utils/session';

interface Department { id: string; name: string; }

export default function EditDoctorPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams();
  const doctorId = params?.id as string;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        const deptRes = await fetch('https://drbloomedi-backend.onrender.com/departments', {
          headers,
          credentials: 'include',
        });
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (Array.isArray(deptData)) setDepartments(deptData);
        }

        const docRes = await fetch(`https://drbloomedi-backend.onrender.com/doctors/${doctorId}`, {
          headers,
          credentials: 'include',
        });
        if (!docRes.ok) throw new Error('Doctor profile not found');
        const doc = await docRes.json();

        setFullName(doc.fullName || '');
        setEmail(doc.user?.email || '');
        setSpecialization(doc.specialization || '');
        setQualifications(doc.qualifications || '');
        setPhone(doc.phone || '');
        setDepartmentId(doc.department?.id || '');
        setIsActive(doc.isActive ?? true);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading doctor details');
      } finally {
        setLoading(false);
      }
    }

    if (doctorId) { loadData(); }
  }, [doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');
      const headers = getAuthHeaders();

      const res = await fetch(`https://drbloomedi-backend.onrender.com/doctors/${doctorId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          fullName: fullName.trim(), email: email.trim(),
          specialization: specialization.trim(), qualifications: qualifications.trim(),
          phone: phone.trim(), departmentId: departmentId || undefined, isActive,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update doctor profile');
      }

      showToast('Doctor profile updated successfully!', 'success');
      router.push('/admin/doctors');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while updating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Loading doctor profile...
      </div>
    );
  }

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
              Edit Doctor Profile
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Update personal details and specialization
            </p>
          </div>
        </div>

        <Link
          href="/admin/doctors"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
        >
          Back to Doctors
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
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">Doctor Full Name *</label>
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
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">Doctor Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">Specialization *</label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">Qualifications *</label>
                <input
                  type="text"
                  required
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1">Account Status</label>
                <select
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                  className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
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
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {submitting ? 'Updating Profile...' : '✓ Update Doctor'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}