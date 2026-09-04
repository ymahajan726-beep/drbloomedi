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
        `http://localhost:4000/patients?search=${encodeURIComponent(query)}`
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
      await fetch(`http://localhost:4000/patients/${id}`, {
        method: 'DELETE',
      });
      loadPatients(search);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Patients Directory & Medical Registry
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage Electronic Medical Records (EMR), Demographics & Emergency Contacts
          </p>
        </div>
        <Link
          href="/admin/patients/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Register Patient</span>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Patients
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {patients.length}
            </p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">👥</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Outpatients (OPD)
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {patients.filter((p) => p.patientType === 'Outpatient').length}
            </p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">🩺</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Inpatients / Emergency
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {patients.filter((p) => p.patientType !== 'Outpatient').length}
            </p>
          </div>
          <span className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xl">🚨</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name, email, phone, blood group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          Showing {patients.length} patients
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading patient records...
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">👥</span>
            <p className="text-sm font-semibold text-slate-700">
              No patients registered yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Register Patient&quot; to add a new medical record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Demographics</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Allergies / History</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">
                      <div>{pat.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {pat.email}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {pat.age} yrs • {pat.gender}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-black text-[11px]">
                        {pat.bloodGroup}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{pat.phone}</div>
                      {pat.emergencyContact && (
                        <div className="text-[10px] text-slate-400">
                          Emerg: {pat.emergencyContact}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          pat.patientType === 'Emergency'
                            ? 'bg-red-100 text-red-700'
                            : pat.patientType === 'Inpatient'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {pat.patientType.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-600 text-[11px]">
                      {pat.medicalHistory || 'None reported'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/admin/patients/${pat.id}/edit`}
                        className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(pat.id, pat.fullName)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
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
    </div>
  );
}