'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Receptionist {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shiftTiming: string;
  counterDesk: string;
  isActive: boolean;
  createdAt: string;
}

export default function ReceptionListPage() {
  const [staff, setStaff] = useState<Receptionist[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStaff = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:4000/reception?search=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load reception staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff(search);
  }, [search]);

  const handleToggleStatus = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/reception/${id}/toggle`, {
        method: 'PATCH',
      });
      loadStaff(search);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from reception?`)) return;
    try {
      await fetch(`http://localhost:4000/reception/${id}`, {
        method: 'DELETE',
      });
      loadStaff(search);
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = staff.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Reception Staff & Front Desk
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage Front-Desk Personnel, Duty Shifts & Counter Allocation
          </p>
        </div>
        <Link
          href="/admin/reception/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Add Receptionist</span>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Receptionists
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {staff.length}
            </p>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">🧑‍💼</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active On Duty
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {activeCount}
            </p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">🟢</span>
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
            placeholder="Search by name, email, or desk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          Showing {staff.length} staff members
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading reception staff...
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">🧑‍💼</span>
            <p className="text-sm font-semibold text-slate-700">
              No reception staff registered yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Add Receptionist&quot; to create front-desk credentials.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Desk / Counter</th>
                  <th className="p-4">Shift Schedule</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">
                      {member.fullName}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-medium">{member.phone}</div>
                      <div className="text-[11px] text-slate-400">{member.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-semibold">
                        {member.counterDesk}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {member.shiftTiming}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(member.id)}
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide transition ${
                          member.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {member.isActive ? '● ACTIVE' : '○ DEACTIVATED'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/admin/reception/${member.id}/edit`}
                        className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(member.id, member.fullName)}
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