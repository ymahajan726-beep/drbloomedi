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
      const res = await fetch('http://localhost:4000/reception', {
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
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Add Reception Staff</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create front-desk credentials and counter assignment
          </p>
        </div>
        <Link
          href="/admin/reception"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Back to Staff
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <input type="text" style={{ display: 'none' }} aria-hidden="true" />
          <input type="password" style={{ display: 'none' }} aria-hidden="true" />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              autoComplete="off"
              placeholder="e.g. Priya Sharma"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Login Email *
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="reception@drbloomedi.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="Set staff password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                autoComplete="off"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Counter Desk
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="e.g. Desk 1 - Main OPD"
                value={form.counterDesk}
                onChange={(e) => setForm({ ...form, counterDesk: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Duty Shift Timing
            </label>
            <select
              value={form.shiftTiming}
              onChange={(e) => setForm({ ...form, shiftTiming: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin/reception"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              {saving ? 'Adding...' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}