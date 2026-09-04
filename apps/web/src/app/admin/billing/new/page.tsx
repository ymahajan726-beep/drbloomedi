'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
}

interface Doctor {
  id: number;
  specialization: string;
  user?: { email: string };
}

export default function NewBillingPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    consultationFee: 500,
    treatmentCharges: 0,
    medicineCharges: 0,
    discount: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [patRes, docRes] = await Promise.all([
          fetch('http://localhost:4000/patients'),
          fetch('http://localhost:4000/doctors'),
        ]);

        if (patRes.ok) {
          const p = await patRes.json();
          setPatients(Array.isArray(p) ? p : []);
          if (Array.isArray(p) && p.length > 0) {
            setForm((prev) => ({ ...prev, patientId: p[0].id }));
          }
        }

        if (docRes.ok) {
          const d = await docRes.json();
          setDoctors(Array.isArray(d) ? d : []);
          if (Array.isArray(d) && d.length > 0) {
            setForm((prev) => ({ ...prev, doctorId: String(d[0].id) }));
          }
        }
      } catch (err) {
        console.error('Failed to load dependencies', err);
      }
    }
    loadData();
  }, []);

  const total = Math.max(
    0,
    Number(form.consultationFee) +
      Number(form.treatmentCharges) +
      Number(form.medicineCharges) -
      Number(form.discount),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch('http://localhost:4000/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          doctorId: form.doctorId ? Number(form.doctorId) : undefined,
          consultationFee: Number(form.consultationFee),
          treatmentCharges: Number(form.treatmentCharges),
          medicineCharges: Number(form.medicineCharges),
          discount: Number(form.discount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate invoice');

      router.push('/admin/billing');
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
          <h1 className="text-2xl font-black text-slate-900">Generate Patient Invoice</h1>
          <p className="text-xs text-slate-500 mt-1">
            Bill Consultation, Medicine & Laboratory Services
          </p>
        </div>
        <Link
          href="/admin/billing"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Back to Billing
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Patient *
              </label>
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Attending Doctor
              </label>
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">General OPD / Hospital</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.email} - {d.specialization}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.consultationFee}
                onChange={(e) =>
                  setForm({ ...form, consultationFee: Number(e.target.value) })
                }
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Treatment / Lab Charges (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.treatmentCharges}
                onChange={(e) =>
                  setForm({ ...form, treatmentCharges: Number(e.target.value) })
                }
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Medicine Charges (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.medicineCharges}
                onChange={(e) =>
                  setForm({ ...form, medicineCharges: Number(e.target.value) })
                }
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Card</option>
                <option value="Insurance">Insurance / TPA</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payment Status
              </label>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </div>
          </div>

          {/* Invoice Summary Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Total Calculated Bill
            </span>
            <span className="text-xl font-black text-slate-900">₹{total.toLocaleString()}</span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin/billing"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              {saving ? 'Generating...' : 'Save & Print Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}