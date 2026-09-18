'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  bloodGroup: string;
  patientType: string;
  emergencyContact?: string;
  medicalHistory?: string;
  createdAt: string;
}

export default function PatientsListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPatients = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://drbloomedi-backend.onrender.com/patients?search=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(search);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove records for ${name}?`)) return;
    try {
      await fetch(`https://drbloomedi-backend.onrender.com/patients/${id}`, {
        method: 'DELETE',
      });
      loadPatients(search);
    } catch (err) {
      console.error(err);
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
              Patients Directory & Medical Registry
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage Electronic Medical Records (EMR), Demographics & Emergency Contacts
            </p>
          </div>
        </div>

        <Link
          href="/admin/patients/new"
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span>
          <span>Register Patient</span>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Patients
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {patients.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">
              👥
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Outpatients (OPD)
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {patients.filter((p) => p.patientType === 'Outpatient').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base border border-emerald-200 dark:border-emerald-900 font-mono font-bold">
              🩺
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Inpatients / Emergency
              </p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {patients.filter((p) => p.patientType !== 'Outpatient').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-base border border-rose-200 dark:border-rose-900 font-mono font-bold">
              🚨
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name, email, phone, blood group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition font-medium"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-mono">
            Showing {patients.length} patients
          </span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              Loading patient records...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="text-4xl block mb-2">👥</span>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No patients registered yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click &quot;Register Patient&quot; to add a new medical record.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-3">Patient Name</th>
                    <th className="py-3 px-3">Demographics</th>
                    <th className="py-3 px-3">Blood Group</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Allergies / History</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {patients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div>{pat.fullName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {pat.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {pat.age} yrs • {pat.gender}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-md font-bold text-[10px]">
                          {pat.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-mono">{pat.phone}</div>
                        {pat.emergencyContact && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            Emerg: {pat.emergencyContact}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-md font-semibold text-[10px] border ${
                            pat.patientType === 'Emergency'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                              : pat.patientType === 'Inpatient'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                          }`}
                        >
                          {pat.patientType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600 dark:text-slate-300 text-[11px]">
                        {pat.medicalHistory || 'None reported'}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <Link
                          href={`/admin/patients/${pat.id}/edit`}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-blue-600 dark:text-blue-400 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition shadow-2xs"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(pat.id, pat.fullName)}
                          className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}