'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewReceptionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    shiftTiming: 'Morning (08:00 AM - 04:00 PM)',
    counterDesk: 'Desk 1 - Main OPD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch('https://drbloomedi-backend.onrender.com/reception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register receptionist');

      router.push('/admin/reception');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

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
              Add Reception Staff
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Create front-desk credentials and counter assignment
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
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            <input type="text" style={{ display: 'none' }} aria-hidden="true" />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" />

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. Priya Sharma"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="reception@drbloomedi.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Set staff password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  autoComplete="off"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-mono font-medium transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Counter Desk
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Desk 1 - Main OPD"
                  value={form.counterDesk}
                  onChange={(e) => setForm({ ...form, counterDesk: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Duty Shift Timing
              </label>
              <select
                value={form.shiftTiming}
                onChange={(e) => setForm({ ...form, shiftTiming: e.target.value })}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
              >
                <option value="Morning (08:00 AM - 04:00 PM)">
                  Morning (08:00 AM - 04:00 PM)
                </option>
                <option value="Evening (02:00 PM - 10:00 PM)">
                  Evening (02:00 PM - 10:00 PM)
                </option>
                <option value="Night (10:00 PM - 08:00 AM)">
                  Night (10:00 PM - 08:00 AM)
                </option>
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
                {saving ? 'Adding...' : 'Save Staff Member'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}