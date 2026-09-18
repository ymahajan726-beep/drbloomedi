'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditReceptionPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    shiftTiming: 'Morning (08:00 AM - 04:00 PM)',
    counterDesk: 'Desk 1 - Main OPD',
    isActive: true,
  });

  useEffect(() => {
    async function loadStaff() {
      try {
        setLoading(true);
        const res = await fetch(`https://drbloomedi-backend.onrender.com/reception/${staffId}`);
        if (res.ok) {
          const data = await res.json();
          setForm({
            fullName: data.fullName || '',
            phone: data.phone || '',
            shiftTiming: data.shiftTiming || 'Morning (08:00 AM - 04:00 PM)',
            counterDesk: data.counterDesk || 'Desk 1 - Main OPD',
            isActive: data.isActive ?? true,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (staffId) {
      loadStaff();
    }
  }, [staffId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch(`https://drbloomedi-backend.onrender.com/reception/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update staff member');

      router.push('/admin/reception');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Loading staff details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            REC
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Edit Receptionist
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Update desk allocation and shift schedule
            </p>
          </div>
        </div>

        <Link
          href="/admin/reception"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
        >
          ← Back to Staff
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-mono font-medium transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Counter Desk</label>
                <input
                  type="text"
                  value={form.counterDesk}
                  onChange={(e) => setForm({ ...form, counterDesk: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Duty Shift Timing</label>
              <select
                value={form.shiftTiming}
                onChange={(e) => setForm({ ...form, shiftTiming: e.target.value })}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              >
                <option value="Morning (08:00 AM - 04:00 PM)">Morning (08:00 AM - 04:00 PM)</option>
                <option value="Evening (02:00 PM - 10:00 PM)">Evening (02:00 PM - 10:00 PM)</option>
                <option value="Night (10:00 PM - 08:00 AM)">Night (10:00 PM - 08:00 AM)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/admin/reception"
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {saving ? 'Updating...' : 'Update Staff'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}