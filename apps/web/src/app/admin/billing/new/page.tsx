'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient { id: string; fullName: string; phone: string; }
interface Doctor { id: number; specialization: string; consultationFee?: number; user?: { email: string; }; }

export default function NewBillingPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

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
    if (!selectedDocId) { setConsultationFee(0); return; }
    const doc = doctors.find((d) => String(d.id) === selectedDocId);
    if (doc) { setConsultationFee(Number(doc.consultationFee) || 500); }
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 font-mono text-xs">
        🔒 Verifying Cashier Clearance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            INV
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Create Patient Invoice
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              DrBlooMedi Cashier & Counter Desk
            </p>
          </div>
        </div>

        <Link
          href="/admin/billing"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
        >
          ← Back to Billing
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              1. Patient & Doctor Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">Select Patient <span className="text-rose-500">*</span></label>
                <select required value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition">
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName} • {p.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">Consulting Doctor (Optional)</label>
                <select value={doctorId} onChange={(e) => handleDoctorChange(e.target.value)} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition">
                  <option value="">-- Direct Counter / None --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={String(d.id)}>{d.user?.email || 'Doctor'} ({d.specialization})</option>
                  ))}
                </select>
              </div>
            </div>

            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              2. Charge Breakdown (₹)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">Consultation Fee</label>
                <input type="number" min="0" value={consultationFee} onChange={(e) => setConsultationFee(Number(e.target.value))} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">Treatment / Procedures</label>
                <input type="number" min="0" value={treatmentCharges} onChange={(e) => setTreatmentCharges(Number(e.target.value))} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">Pharmacy / Medicines</label>
                <input type="number" min="0" value={medicineCharges} onChange={(e) => setMedicineCharges(Number(e.target.value))} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">Discount Concession</label>
                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold bg-slate-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 outline-none focus:border-rose-500 transition" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 rounded-lg flex items-center justify-between border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Net Amount Payable</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Subtotal: ₹{subTotal} | Discount: ₹{discount}</p>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{grandTotal.toFixed(2)}</div>
            </div>

            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              3. Payment Settlement
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition">
                  <option value="Cash">Cash Counter</option>
                  <option value="UPI">UPI / QR Code Scan</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Insurance">TPA / Health Insurance</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition">
                  <option value="Paid">Paid (Full Settlement)</option>
                  <option value="Pending">Pending (Unpaid Tab)</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">Remarks / Notes</label>
                <input type="text" placeholder="e.g. Counter A Reception Receipt" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push('/admin/billing')} className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">
              {submitting ? 'Generating Invoice...' : '✓ Generate & Save Invoice'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}