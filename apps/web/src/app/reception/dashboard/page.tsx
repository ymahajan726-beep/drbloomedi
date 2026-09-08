'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { performLogout } from '@/utils/logout';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';

interface BillCalculation {
  consultationFee: number;
  labTestsFee: number;
  labTestNames: string[];
  treatmentFee: number;
  pharmacyFee: number;
  discount: number;
  netPayable: number;
}

export default function ReceptionDashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  // Billing & Discharge Clearance Modal State
  const [selectedAptForPay, setSelectedAptForPay] = useState<any | null>(null);

  // Detailed Hospital Service Breakdown State
  const [billData, setBillData] = useState<BillCalculation>({
    consultationFee: 500,
    labTestsFee: 0,
    labTestNames: [],
    treatmentFee: 0,
    pharmacyFee: 0,
    discount: 0,
    netPayable: 500,
  });

  // Razorpay Interactive Modal State
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Final Paid Invoice State & Tracking
  const [paidReceipt, setPaidReceipt] = useState<any | null>(null);
  const [paidMap, setPaidMap] = useState<Record<string, { isPaid: boolean; amount: number }>>({});

  // 1. Load saved payments & revenue map from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('drbloomedi_paid_appointments_v2');
      if (saved) {
        setPaidMap(JSON.parse(saved));
      }
    } catch {}
    fetchAppointments();
  }, []);

  // 2. Real-time WebSockets connection to live Render backend
  useEffect(() => {
    const socket: Socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('reception:appointment:new', (newApt: any) => {
      setAppointments((prev) => {
        const exists = prev.some((item) => item.id === newApt.id);
        if (exists) return prev;
        return [newApt, ...prev];
      });

      const pName = newApt.patient?.fullName || 'Walk-in Patient';
      const slot = newApt.timeSlot || '10:00 AM';
      const token = newApt.appointmentNumber || 'OPD-TOKEN';

      setLiveAlert(`⚡ LIVE ARRIVAL: ${pName} (${token}) booked for ${slot}`);
      setTimeout(() => setLiveAlert(null), 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Logout Trigger Function
  const handleLogout = () => {
    if (typeof performLogout === 'function') {
      performLogout();
    } else {
      localStorage.clear();
      document.cookie = 'token=; path=/; max-age=0;';
      document.cookie = 'userRole=; path=/; max-age=0;';
      document.cookie = 'access_token=; path=/; max-age=0;';
      window.location.href = '/login';
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch(`${BACKEND_URL}/appointments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setAppointments(list);

        // Sync payment records
        setPaidMap((prev) => {
          const updated = { ...prev };
          list.forEach((item) => {
            if (item.isPaid === true || item.paymentStatus === 'PAID') {
              if (!updated[item.id]) {
                updated[item.id] = { isPaid: true, amount: 500 };
              }
            }
          });
          try {
            localStorage.setItem('drbloomedi_paid_appointments_v2', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-Fetch Patient Clinical Data & Build Itemized Discharge Bill
  const handleOpenDischargeBilling = async (apt: any) => {
    setSelectedAptForPay(apt);

    // 1. Doctor Consultation Fee
    const consultFee = Number(apt.doctor?.consultationFee) || 500;
    let labTotal = 0;
    let labNames: string[] = [];

    // 2. Direct Sync from Doctor OPD Consult Suite
    try {
      const savedTests = localStorage.getItem(`drbloomedi_lab_orders_${apt.id}`);
      if (savedTests) {
        const parsed = JSON.parse(savedTests);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((t: any) => {
            labTotal += Number(t.testPrice) || 350;
            labNames.push(t.testName);
          });
        }
      }
    } catch (_) {}

    // 3. Fallback to Patient EMR History from Backend
    if (labTotal === 0) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const pId = apt.patientId || apt.patient?.id;

        if (pId) {
          const res = await fetch(`${BACKEND_URL}/patient-portal/history/${pId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          if (res.ok) {
            const history = await res.json();
            if (Array.isArray(history.labOrders) && history.labOrders.length > 0) {
              history.labOrders.forEach((lab: any) => {
                const fee = Number(lab.price) || Number(lab.labTest?.price) || 350;
                labTotal += fee;
                labNames.push(lab.testName || lab.labTest?.testName || 'Pathology Investigation');
              });
            }

            if (labTotal === 0 && Array.isArray(history.prescriptions) && history.prescriptions.length > 0) {
              const latestRx = history.prescriptions[0];
              if (Array.isArray(latestRx.labTests) && latestRx.labTests.length > 0) {
                latestRx.labTests.forEach((name: string) => {
                  labTotal += 350;
                  labNames.push(name);
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Backend history billing fetch fallback:', e);
      }
    }

    if (labTotal === 0 && apt.symptoms && (apt.symptoms.toLowerCase().includes('blood') || apt.symptoms.toLowerCase().includes('test'))) {
      labTotal = 350;
      labNames.push('Complete Blood Count (CBC)');
    }

    const calculatedNet = Math.max(0, consultFee + labTotal);

    setBillData({
      consultationFee: consultFee,
      labTestsFee: labTotal,
      labTestNames: labNames,
      treatmentFee: 0,
      pharmacyFee: 0,
      discount: 0,
      netPayable: calculatedNet,
    });
  };

  // Real-time Dynamic Calculation on Input Changes
  const updateBillField = (field: keyof BillCalculation, val: number) => {
    setBillData((prev) => {
      const updated = { ...prev, [field]: val };
      const subtotal =
        Number(updated.consultationFee || 0) +
        Number(updated.labTestsFee || 0) +
        Number(updated.treatmentFee || 0) +
        Number(updated.pharmacyFee || 0);
      const discount = Number(updated.discount || 0);
      updated.netPayable = Math.max(0, subtotal - discount);
      return updated;
    });
  };

  const markAppointmentAsPaid = (aptId: string, txnId: string, mode: string) => {
    const updated = {
      ...paidMap,
      [aptId]: { isPaid: true, amount: billData.netPayable },
    };
    setPaidMap(updated);
    try {
      localStorage.setItem('drbloomedi_paid_appointments_v2', JSON.stringify(updated));
    } catch {}

    setPaidReceipt({
      patient: selectedAptForPay?.patient,
      appointmentNumber: selectedAptForPay?.appointmentNumber,
      billData: { ...billData },
      paymentId: txnId,
      mode: mode,
      date: new Date().toLocaleDateString(),
    });

    setSelectedAptForPay(null);
    setShowRazorpayModal(false);
    setIsProcessingPayment(false);

    fetchAppointments();
  };

  // Confirm Razorpay Gateway Simulation & Save to DB
  const handleConfirmRazorpayPayment = async () => {
    if (!selectedAptForPay) return;
    setIsProcessingPayment(true);

    const txnId = `pay_${Date.now().toString().slice(-8)}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      await fetch(`${BACKEND_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          razorpay_order_id: `order_${Date.now()}`,
          razorpay_payment_id: txnId,
          appointmentId: selectedAptForPay.id,
          billId: selectedAptForPay.id,
          amount: billData.netPayable,
        }),
      });
    } catch (err) {
      console.warn('Backend payment sync fallback:', err);
    }

    setTimeout(() => {
      markAppointmentAsPaid(
        selectedAptForPay.id,
        txnId,
        `Razorpay Online (${selectedPaymentTab.toUpperCase()})`,
      );
    }, 1200);
  };

  // Cash at Counter & Save to DB
  const handleCashPayment = async () => {
    if (!selectedAptForPay) return;
    const txnId = `CASH-${Date.now().toString().slice(-6)}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      await fetch(`${BACKEND_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          razorpay_order_id: `cash_${Date.now()}`,
          razorpay_payment_id: txnId,
          appointmentId: selectedAptForPay.id,
          billId: selectedAptForPay.id,
          amount: billData.netPayable,
        }),
      });
    } catch {}

    markAppointmentAsPaid(selectedAptForPay.id, txnId, 'Cash Counter');
  };

  // Real-Time Analytics / Business KPI Calculations
  const analytics = useMemo(() => {
    const totalPatients = appointments.length;
    let totalRevenue = 0;
    let dischargedCount = 0;
    let pendingCount = 0;

    appointments.forEach((apt) => {
      const isPaid = paidMap[apt.id]?.isPaid || apt.isPaid === true || apt.paymentStatus === 'PAID';
      if (isPaid) {
        dischargedCount += 1;
        totalRevenue += Number(paidMap[apt.id]?.amount || 500);
      } else {
        pendingCount += 1;
      }
    });

    return { totalPatients, totalRevenue, dischargedCount, pendingCount };
  }, [appointments, paidMap]);

  const filteredAppointments = appointments.filter((apt) => {
    const q = search.toLowerCase();
    const name = (apt.patient?.fullName || '').toLowerCase();
    const phone = (apt.patient?.phone || '').toLowerCase();
    const token = (apt.appointmentNumber || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || token.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-100/70 p-6 md:p-10 font-sans max-w-7xl mx-auto space-y-6">
      {/* 🔔 LIVE RECEPTION POPUP */}
      {liveAlert && (
        <div className="p-4 bg-emerald-600 text-white text-xs rounded-2xl font-bold flex justify-between items-center shadow-xl animate-bounce border-2 border-emerald-400">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <span className="text-sm tracking-wide">{liveAlert}</span>
          </div>
          <button
            onClick={() => setLiveAlert(null)}
            className="font-black text-white hover:text-emerald-200 bg-white/20 px-2.5 py-1 rounded-lg"
          >
            DISMISS ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Reception Desk & Patient Discharge Counter
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                }`}
              ></span>
              {isConnected ? 'Live Counter Sync Active' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-window patient check-ins, auto-calculating discharge billing, and instant settlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAppointments}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            🔄 Refresh
          </button>
          <a
            href="/patient-portal"
            target="_blank"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            + New Walk-in / Booking
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition shadow-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* 📊 RECEPTION DESK BUSINESS & DISCHARGE ANALYTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Patients</p>
          <p className="text-2xl font-black text-slate-900">{analytics.totalPatients}</p>
          <p className="text-[10px] text-slate-500">Registered today in OPD</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Revenue Collected</p>
          <p className="text-2xl font-black text-emerald-600">₹{analytics.totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500">Total hospital income cleared</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Discharged & Settled</p>
          <p className="text-2xl font-black text-blue-600">{analytics.dischargedCount}</p>
          <p className="text-[10px] text-slate-500">Bills cleared at counter</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Settlement</p>
          <p className="text-2xl font-black text-amber-600">{analytics.pendingCount}</p>
          <p className="text-[10px] text-slate-500">In consultation / awaiting bill</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-4">
          <input
            type="text"
            placeholder="Search patient by Name, Phone or Token to settle bill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3">Token</th>
                <th className="py-3">Patient Identity</th>
                <th className="py-3">Phone</th>
                <th className="py-3">Date & Slot</th>
                <th className="py-3 text-center">Clinical Status</th>
                <th className="py-3 text-right">Discharge & Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No appointments found matching search.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const isPaid =
                    paidMap[apt.id]?.isPaid === true ||
                    apt.isPaid === true ||
                    apt.paymentStatus === 'PAID';

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 font-mono font-bold text-slate-900">
                        {apt.appointmentNumber || 'APT-OPD'}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">
                        {apt.patient?.fullName || 'Walk-in Patient'}
                      </td>
                      <td className="py-3.5 text-slate-600 font-mono">
                        {apt.patient?.phone || 'N/A'}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {String(apt.appointmentDate).split('T')[0]} •{' '}
                        <span className="font-bold text-slate-800">{apt.timeSlot || '10:00 AM'}</span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                            apt.status === 'Completed' || apt.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {apt.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {isPaid ? (
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                            ✓ Settled & Discharged
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenDischargeBilling(apt)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 transition shadow-sm"
                          >
                            💳 Settle & Discharge
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💳 COMPREHENSIVE PATIENT DISCHARGE & INVOICE CLEARANCE MODAL */}
      {selectedAptForPay && !showRazorpayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Hospital Discharge & Invoice Clearance</h3>
                <p className="text-xs text-slate-500">
                  Patient: <strong className="text-slate-800">{selectedAptForPay.patient?.fullName}</strong> • Token: #{selectedAptForPay.appointmentNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedAptForPay(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Charge Breakdown (Auto-populated with editable additions) */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Hospital Services & Charges Breakdown (₹)
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. Doctor Consultation */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    Consultation Fee
                  </label>
                  <input
                    type="number"
                    value={billData.consultationFee}
                    onChange={(e) => updateBillField('consultationFee', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none"
                  />
                </div>

                {/* 2. Diagnostic Pathology / Lab */}
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-1">
                  <label className="text-[10px] font-bold text-purple-700 uppercase block">
                    Pathology / Lab Tests
                  </label>
                  <input
                    type="number"
                    value={billData.labTestsFee}
                    onChange={(e) => updateBillField('labTestsFee', Number(e.target.value))}
                    className="w-full bg-white border border-purple-200 rounded-xl p-2 font-bold text-purple-900 outline-none"
                  />
                </div>

                {/* 3. Treatment / Procedures */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    Treatment / Procedures
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={billData.treatmentFee || ''}
                    onChange={(e) => updateBillField('treatmentFee', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none"
                  />
                </div>

                {/* 4. In-House Pharmacy / Medicines */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    Pharmacy / Medicines (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={billData.pharmacyFee || ''}
                    onChange={(e) => updateBillField('pharmacyFee', Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Lab tests list badge if found */}
              {billData.labTestNames.length > 0 && (
                <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2">
                  <span className="text-sm">🧪</span>
                  <span className="text-[11px] text-purple-800 font-semibold">
                    Prescribed Investigations: {billData.labTestNames.join(', ')}
                  </span>
                </div>
              )}

              {/* 5. Discount / Concession Field */}
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <label className="text-[10px] font-bold text-rose-700 uppercase block">
                    Discount / Special Concession (₹)
                  </label>
                  <p className="text-[10px] text-slate-500">Doctor concession, senior citizen, or waiver</p>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  value={billData.discount || ''}
                  onChange={(e) => updateBillField('discount', Number(e.target.value))}
                  className="w-32 bg-white border border-rose-200 rounded-xl p-2 font-bold text-rose-700 text-right outline-none"
                />
              </div>

              {/* Final Net Amount Summary Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Payable Amount</p>
                  <p className="text-xs text-slate-300">
                    Subtotal: ₹{billData.consultationFee + billData.labTestsFee + billData.treatmentFee + billData.pharmacyFee} | Concession: -₹{billData.discount}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">₹{billData.netPayable}.00</span>
                </div>
              </div>
            </div>

            {/* Payment & Discharge Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowRazorpayModal(true)}
                className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <span>⚡</span> Pay via Razorpay (UPI / Card)
              </button>

              <button
                onClick={handleCashPayment}
                className="py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <span>💵</span> Collect Cash & Settle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 RAZORPAY GATEWAY CHECKOUT MODAL */}
      {showRazorpayModal && selectedAptForPay && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg">
                  R
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                    DrBlooMedi Healthcare
                    <span className="text-[9px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.5 rounded">
                      SANDBOX
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Token #{selectedAptForPay.appointmentNumber}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Bill</p>
                <p className="text-lg font-black text-emerald-400">₹{billData.netPayable}.00</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => setSelectedPaymentTab('upi')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    selectedPaymentTab === 'upi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  📱 UPI / QR
                </button>
                <button
                  onClick={() => setSelectedPaymentTab('card')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    selectedPaymentTab === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  💳 Cards
                </button>
                <button
                  onClick={() => setSelectedPaymentTab('netbanking')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    selectedPaymentTab === 'netbanking' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  🏦 NetBanking
                </button>
              </div>

              {selectedPaymentTab === 'upi' && (
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-4xl">📱</span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">UPI QR SCAN</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">PhonePe, Google Pay, or Paytm</p>
                  <p className="text-[10px] text-slate-400 font-mono">drbloomedi@okhdfcbank</p>
                </div>
              )}

              {selectedPaymentTab === 'card' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Test Card Number</label>
                    <input
                      type="text"
                      readOnly
                      value="4111 •••• •••• 1111 (Authorized Card)"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      readOnly
                      value="12 / 28"
                      className="p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
                    />
                    <input
                      type="text"
                      readOnly
                      value="123"
                      className="p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
                    />
                  </div>
                </div>
              )}

              {selectedPaymentTab === 'netbanking' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                    <div
                      key={bank}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-center"
                    >
                      🏦 {bank}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleConfirmRazorpayPayment}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <span>✓ Pay ₹{billData.netPayable}.00 & Settle</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={() => setShowRazorpayModal(false)}
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 FINAL TAX INVOICE PRINTABLE DISCHARGE RECEIPT */}
      {paidReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1 border-b border-slate-100 pb-4">
              <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 inline-flex items-center justify-center text-xl mb-1">
                ✓
              </span>
              <h2 className="text-xl font-black text-slate-900">Hospital Discharge Cleared!</h2>
              <p className="text-[11px] text-slate-400">DrBlooMedi Healthcare Official Tax Invoice & Clearance</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-bold text-slate-900">{paidReceipt.patient?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Token Number:</span>
                <span className="font-mono font-bold text-slate-900">{paidReceipt.appointmentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-[10px] text-blue-600 font-bold">{paidReceipt.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-bold text-emerald-700">{paidReceipt.mode}</span>
              </div>

              {/* Itemized Services on Print Receipt */}
              <div className="border-t border-slate-200 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>OPD Consultation Fee:</span>
                  <span>₹{paidReceipt.billData?.consultationFee || 500}.00</span>
                </div>
                {paidReceipt.billData?.labTestsFee > 0 && (
                  <div className="flex justify-between text-purple-700 font-medium">
                    <span>Diagnostic Lab Tests:</span>
                    <span>₹{paidReceipt.billData.labTestsFee}.00</span>
                  </div>
                )}
                {paidReceipt.billData?.treatmentFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Treatment / Procedures:</span>
                    <span>₹{paidReceipt.billData.treatmentFee}.00</span>
                  </div>
                )}
                {paidReceipt.billData?.pharmacyFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Pharmacy Dispensing:</span>
                    <span>₹{paidReceipt.billData.pharmacyFee}.00</span>
                  </div>
                )}
                {paidReceipt.billData?.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Concession / Discount:</span>
                    <span>-₹{paidReceipt.billData.discount}.00</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                <span className="font-bold text-slate-900">Total Cleared:</span>
                <span className="font-black text-emerald-700 text-base">₹{paidReceipt.billData?.netPayable}.00</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-sm"
              >
                🖨️ Print Discharge Bill
              </button>
              <button
                type="button"
                onClick={() => setPaidReceipt(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}