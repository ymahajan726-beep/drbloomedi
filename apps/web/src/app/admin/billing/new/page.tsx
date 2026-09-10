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
  consultationFee?: number;
  user?: {
    email: string;
  };
}

export default function NewBillingPage() {
  const router = useRouter();

  // Security & State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Form Fields
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [treatmentCharges, setTreatmentCharges] = useState<number>(0);
  const [medicineCharges, setMedicineCharges] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Auth Guard
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const role = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();

    if (!token || (role !== 'ADMIN' && role !== 'RECEPTION')) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  // 2. Fetch Lookup Data
  useEffect(() => {
    if (!isAuthorized) return;

    async function loadData() {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch('https://drbloomedi-backend.onrender.com/patients'),
          fetch('https://drbloomedi-backend.onrender.com/doctors'),
        ]);

        if (patientsRes.ok) {
          const pData = await patientsRes.json();
          setPatients(Array.isArray(pData) ? pData : []);
        }
        if (doctorsRes.ok) {
          const dData = await doctorsRes.json();
          setDoctors(Array.isArray(dData) ? dData : []);
        }
      } catch (err) {
        console.error('Failed to load billing dependencies', err);
      }
    }

    loadData();
  }, [isAuthorized]);

  const handleDoctorChange = (selectedDocId: string) => {
    setDoctorId(selectedDocId);
    if (!selectedDocId) {
      setConsultationFee(0);
      return;
    }
    const doc = doctors.find((d) => String(d.id) === selectedDocId);
    if (doc) {
      setConsultationFee(Number(doc.consultationFee) || 500);
    }
  };

  const subTotal = (Number(consultationFee) || 0) + (Number(treatmentCharges) || 0) + (Number(medicineCharges) || 0);
  const grandTotal = Math.max(0, subTotal - (Number(discount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!patientId) {
      setErrorMessage('Please select a valid patient.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        patientId,
        doctorId: doctorId ? Number(doctorId) : undefined,
        consultationFee: Number(consultationFee) || 0,
        treatmentCharges: Number(treatmentCharges) || 0,
        medicineCharges: Number(medicineCharges) || 0,
        discount: Number(discount) || 0,
        paymentStatus,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      const res = await fetch('https://drbloomedi-backend.onrender.com/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        const err = resData?.message || `Failed to create invoice (Status: ${res.status})`;
        throw new Error(Array.isArray(err) ? err.join(', ') : err);
      }

      router.push('/admin/billing');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving billing entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-900 font-mono text-xs">
        🔒 Verifying Cashier Clearance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/billing"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-bold transition shadow-sm"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Create Patient Invoice</h1>
            <p className="text-xs text-slate-400">DrBlooMedi Cashier & Counter Desk</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-600">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
              1. Patient & Doctor Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Select Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} • {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Consulting Doctor (Optional)</label>
                <select
                  value={doctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">-- Direct Counter / None --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.user?.email || 'Doctor'} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider pt-4 pb-3 border-b border-slate-100">
              2. Charge Breakdown (₹)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Consultation Fee</label>
                <input
                  type="number"
                  min="0"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Treatment / Procedures</label>
                <input
                  type="number"
                  min="0"
                  value={treatmentCharges}
                  onChange={(e) => setTreatmentCharges(Number(e.target.value))}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pharmacy / Medicines</label>
                <input
                  type="number"
                  min="0"
                  value={medicineCharges}
                  onChange={(e) => setMedicineCharges(Number(e.target.value))}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Discount Concession</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl font-mono font-bold text-rose-600 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-4 bg-white text-slate-900 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Amount Payable</p>
                <p className="text-xs text-slate-600">Subtotal: ₹{subTotal} | Discount: ₹{discount}</p>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">₹{grandTotal.toFixed(2)}</div>
            </div>

            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider pt-4 pb-3 border-b border-slate-100">
              3. Payment Settlement
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Cash">Cash Counter</option>
                  <option value="UPI">UPI / QR Code Scan</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Insurance">TPA / Health Insurance</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Paid">Paid (Full Settlement)</option>
                  <option value="Pending">Pending (Unpaid Tab)</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Counter A Reception Receipt"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1.5 p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/billing')}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
            >
              {submitting ? 'Generating Invoice...' : '✓ Generate & Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}