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

  // Form Fields
  const [fullName, setFullName] = useState(''); // <-- Doctor Name State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Departments for Dropdown
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

      // Yaha par payload me fullName bhejna hai:
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

      alert('Doctor added successfully!');
      router.push('/admin/doctors');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Add New Doctor</h1>
          <p className="text-xs text-slate-500">Create a doctor profile and linked login account</p>
        </div>
        <Link
          href="/admin/doctors"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          Back to List
        </Link>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Doctor Full Name Input */}
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
            {/* 2. Doctor Email */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Doctor Email (Login ID) *
              </label>
              <input
                type="email"
                required
                placeholder="doctor@drbloomedi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>

            {/* 3. Password */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Account Password
              </label>
              <input
                type="password"
                placeholder="Default: Doctor@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 4. Specialization */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Specialization *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiologist, Pediatrician"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>

            {/* 5. Phone Number */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 6. Qualifications */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Qualifications *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MBBS, MD, MS"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:border-blue-600"
              />
            </div>

            {/* 7. Department */}
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
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              {loading ? 'Creating Profile...' : '✓ Save Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}