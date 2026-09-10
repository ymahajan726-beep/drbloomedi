'use client';

import React, { useState, useEffect } from 'react';

interface Department {
  id: string;
  name: string;
  description: string;
  location: string;
  totalBeds: number;
  status: string;
  doctors?: any[];
  createdAt: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: 'Building A, 2nd Floor',
    totalBeds: 25,
  });

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch('https://drbloomedi-backend.onrender.com/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalBeds: Number(form.totalBeds),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create department');

      setIsModalOpen(false);
      setForm({
        name: '',
        description: '',
        location: 'Building A, 2nd Floor',
        totalBeds: 25,
      });
      loadDepartments();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name} department?`)) return;
    try {
      await fetch(`https://drbloomedi-backend.onrender.com/departments/${id}`, { method: 'DELETE' });
      loadDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Hospital Departments & Wings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure Clinical Specialties, Inpatient Wards & Bed Allocations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Add Department</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-white backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Add New Department</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology, Neurology"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ward Location / Floor</label>
                <input
                  type="text"
                  placeholder="e.g. Building B, 3rd Floor"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bed Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.totalBeds}
                  onChange={(e) => setForm({ ...form, totalBeds: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Specialty Scope</label>
                <textarea
                  rows={2}
                  placeholder="Specialty procedures and clinical focus..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                >
                  {saving ? 'Creating...' : 'Save Wing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400 text-xs">Loading hospital wings...</div>
        ) : departments.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <span className="text-4xl block mb-2">🏢</span>
            <p className="text-sm font-semibold text-slate-700">No departments added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Add Department" to create your first clinical specialty wing.</p>
          </div>
        ) : (
          departments.map((dept) => (
            <div key={dept.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                  <p className="text-xs text-slate-500">{dept.location}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold">
                  {dept.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {dept.description || 'Specialized clinical care and patient operations.'}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">🛏️ {dept.totalBeds} Beds</span>
                <span className="font-semibold text-blue-600">🩺 {dept.doctors?.length || 0} Doctors</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDelete(dept.id, dept.name)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Delete Wing
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}