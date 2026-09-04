'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
}

interface Doctor {
  id: number;
  specialization: string;
  qualifications: string;
  phone: string;
  isActive: boolean;
  user?: {
    id: string;
    email: string;
  };
  department?: Department;
  createdAt: string;
}

export default function DoctorsListPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDoctors = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:4000/doctors?search=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDoctors(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load doctors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors(search);
  }, [search]);

  const handleToggleStatus = async (id: number) => {
    try {
      await fetch(`http://localhost:4000/doctors/${id}/toggle`, {
        method: 'PATCH',
      });
      loadDoctors(search);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Are you sure you want to remove doctor (${email})?`)) return;
    try {
      await fetch(`http://localhost:4000/doctors/${id}`, {
        method: 'DELETE',
      });
      loadDoctors(search);
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = doctors.filter((d) => d.isActive).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Hospital Doctors & Specialists
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage Doctor Profiles, Clinical Wings & Shift Availability
          </p>
        </div>
        <Link
          href="/admin/doctors/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Register Doctor</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Doctors
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {doctors.length}
            </p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">🩺</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Duty Consultants
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {activeCount}
            </p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">🟢</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by specialization, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          Showing {doctors.length} doctors
        </span>
      </div>

      {/* Doctors Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading doctors list...
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">🩺</span>
            <p className="text-sm font-semibold text-slate-700">
              No doctors registered yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Register Doctor&quot; to add a new doctor profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Doctor Account</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Qualifications</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Duty Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">
                      {doc.user?.email || 'N/A'}
                    </td>
                    <td className="p-4 text-blue-600 font-semibold">
                      {doc.specialization || 'General'}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {doc.qualifications || 'MBBS'}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-[11px]">
                        {doc.department?.name || 'General Wing'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-800 font-medium">
                      {doc.phone || 'N/A'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(doc.id)}
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide transition ${
                          doc.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {doc.isActive ? '● ACTIVE' : '○ INACTIVE'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/admin/doctors/${doc.id}/edit`}
                        className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(doc.id, doc.user?.email || '')}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}