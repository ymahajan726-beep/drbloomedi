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
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            DEP
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Hospital Departments & Wings
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Configure Clinical Specialties, Inpatient Wards & Bed Allocations
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span>
          <span>Add Department</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Add New Department</h3>
                <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs cursor-pointer">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology, Neurology"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase">Ward Location / Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. Building B, 3rd Floor"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase">Bed Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={form.totalBeds}
                    onChange={(e) => setForm({ ...form, totalBeds: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase">Description / Specialty Scope</label>
                  <textarea
                    rows={2}
                    placeholder="Specialty procedures and clinical focus..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition cursor-pointer shadow-2xs"
                  >
                    {saving ? 'Creating...' : 'Save Wing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Department Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-mono text-xs">Loading hospital wings...</div>
          ) : departments.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <span className="text-4xl block mb-2">🏢</span>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No departments added yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Click &quot;+ Add Department&quot; to create your first clinical specialty wing.</p>
            </div>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{dept.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{dept.location}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-md text-[10px] font-semibold">
                      {dept.status || 'Active'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-normal">
                    {dept.description || 'Specialized clinical care and patient operations.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">🛏️ {dept.totalBeds} Beds</span>
                    <span className="text-blue-600 dark:text-blue-400">🩺 {dept.doctors?.length || 0} Doctors</span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Delete Wing
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}