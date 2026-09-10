'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

interface Department {
  id: string;
  name: string;
}

export default function EditDoctorPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams();
  const doctorId = params?.id as string;

  // Form States (Including Doctor Full Name)
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

  // 1. Fetch Departments & Existing Doctor Details
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch Departments
        const deptRes = await fetch('https://drbloomedi-backend.onrender.com/departments');
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (Array.isArray(deptData)) setDepartments(deptData);
        }

        // Fetch Doctor by ID
        const docRes = await fetch(`https://drbloomedi-backend.onrender.com/doctors/${doctorId}`);
        if (!docRes.ok) throw new Error('Doctor profile not found');
        const doc = await docRes.json();

        // Pre-fill states
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

    if (doctorId) {
      loadData();
    }
  }, [doctorId]);

  // 2. Handle Submit (PUT request to Backend)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch(`https://drbloomedi-backend.onrender.com/doctors/${doctorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          specialization: specialization.trim(),
          qualifications: qualifications.trim(),
          phone: phone.trim(),
          departmentId: departmentId || undefined,
          isActive,
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
      <div className="p-10 text-center text-xs font-bold text-slate-500">
        Loading doctor profile...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Edit Doctor Profile</h1>
          <p className="text-xs text-slate-500">Update personal details and specialization</p>
        </div>
        <Link
          href="/admin/doctors"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          Back to Doctors
        </Link>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doctor Name */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Doctor Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Doctor Email (Login ID) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Specialization */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Specialization *
              </label>
              <input
                type="text"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>

            {/* Qualifications */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Qualifications *
              </label>
              <input
                type="text"
                required
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50 focus:border-blue-600"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Account Status
              </label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50 focus:border-blue-600"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/admin/doctors"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              {submitting ? 'Updating Profile...' : '✓ Update Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}