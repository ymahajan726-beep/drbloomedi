'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { performLogout } from '@/utils/logout';
import { useToast } from '@/components/Toast';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';

export default function ReceptionDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  const [walkinForm, setWalkinForm] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'Male',
    specialist: 'General Physician',
    slot: '10:00 AM',
    reason: 'General Checkup',
    patientId: '',
  });
  const [registering, setRegistering] = useState(false);

  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [bill, setBill] = useState({ consult: 500, lab: 0, testNames: [] as string[], treatment: 0, pharma: 0, discount: 0, net: 500 });
  const [paying, setPaying] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('Initializing Official Payment Gateway...');
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
    const poll = setInterval(() => fetchData(true), 7000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const socket: Socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('reception:appointment:new', (newApt: any) => {
      setAppointments((prev) => prev.some(i => i.id === newApt.id) ? prev : [newApt, ...prev]);
      setLiveAlert(`⚡ LIVE ARRIVAL: ${newApt.patient?.fullName || 'Patient'} (${newApt.appointmentNumber || 'OPD'})`);
      setTimeout(() => setLiveAlert(null), 8000);
    });
    return () => { socket.disconnect(); };
  }, []);

  const fetchData = async (isBg = false) => {
    try {
      if (!isBg) setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [aptRes, billRes] = await Promise.all([
        fetch(`${BACKEND_URL}/appointments`, { headers, credentials: 'include' }),
        fetch(`${BACKEND_URL}/billing`, { headers, credentials: 'include' }).catch(() => null)
      ]);

      if (aptRes.ok) {
        const list = await aptRes.json();
        setAppointments(Array.isArray(list) ? list : []);
      }

      if (billRes && billRes.ok) {
        const bList = await billRes.json();
        setBillingRecords(Array.isArray(bList) ? bList : []);
      }
    } catch (e) { console.error(e); }
    finally { if (!isBg) setLoading(false); }
  };

  const handlePhoneChange = async (phoneVal: string) => {
    setWalkinForm(prev => ({ ...prev, phone: phoneVal }));
    if (phoneVal.length === 10) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${BACKEND_URL}/patients?search=${encodeURIComponent(phoneVal)}`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: 'include',
        });
        if (res.ok) {
          const patients = await res.json();
          if (Array.isArray(patients) && patients.length > 0) {
            const matched = patients.find((p: any) => p.phone === phoneVal);
            if (matched) {
              setWalkinForm(prev => ({
                ...prev,
                fullName: matched.fullName || prev.fullName,
                age: matched.age ? String(matched.age) : prev.age,
                gender: matched.gender || prev.gender,
                patientId: matched.id,
              }));
            }
          }
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.fullName || !walkinForm.phone) {
      showToast('Please enter patient name and phone number', 'error');
      return;
    }
    setRegistering(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      let pId = walkinForm.patientId;
      if (!pId) {
        const searchRes = await fetch(`${BACKEND_URL}/patients?search=${encodeURIComponent(walkinForm.phone)}`, { headers, credentials: 'include' });
        if (searchRes.ok) {
          const list = await searchRes.json();
          const found = Array.isArray(list) ? list.find((p: any) => p.phone === walkinForm.phone) : null;
          if (found) pId = found.id;
        }

        if (!pId) {
          const patRes = await fetch(`${BACKEND_URL}/patients`, {
            method: 'POST', headers, credentials: 'include',
            body: JSON.stringify({
              fullName: walkinForm.fullName, phone: walkinForm.phone, age: Number(walkinForm.age) || 30,
              gender: walkinForm.gender, bloodGroup: 'O+', patientType: 'Outpatient', email: `${walkinForm.phone}@drbloomedi.local`,
            }),
          });
          if (patRes.ok) {
            const newPat = await patRes.json();
            pId = newPat.id || newPat._id;
          } else {
            const errBody = await patRes.json().catch(() => ({}));
            throw new Error(errBody.message || 'Failed to register patient record.');
          }
        }
      }

      let doctorId = undefined;
      try {
        const docRes = await fetch(`${BACKEND_URL}/doctors`, { headers, credentials: 'include' });
        if (docRes.ok) {
          const docs = await docRes.json();
          if (Array.isArray(docs) && docs.length > 0) doctorId = docs[0].id;
        }
      } catch {}

      const appointmentPayload: any = {
        patientId: pId,
        appointmentDate: new Date().toISOString().split('T')[0],
        timeSlot: walkinForm.slot || '10:00 AM',
        status: 'Scheduled',
        symptoms: walkinForm.reason || 'Walk-in Consultation',
      };
      if (doctorId) appointmentPayload.doctorId = doctorId;

      const res = await fetch(`${BACKEND_URL}/appointments`, {
        method: 'POST', headers, credentials: 'include', body: JSON.stringify(appointmentPayload),
      });

      if (res.ok) {
        setWalkinForm({ fullName: '', phone: '', age: '', gender: 'Male', specialist: 'General Physician', slot: '10:00 AM', reason: 'General Checkup', patientId: '' });
        fetchData();
        showToast('Walk-in token issued successfully!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Failed to issue walk-in token.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error while issuing token.', 'error');
    } finally { setRegistering(false); }
  };

  const openBilling = async (apt: any) => {
    setSelectedApt(apt);
    const consult = Number(apt.doctor?.consultationFee) || 500;
    setBill({ consult, lab: 0, testNames: [], treatment: 0, pharma: 0, discount: 0, net: consult });
  };

  const updateBill = (field: string, val: number) => {
    setBill(prev => {
      const next = { ...prev, [field]: val };
      const sub = Number(next.consult) + Number(next.lab) + Number(next.treatment) + Number(next.pharma);
      next.net = Math.max(0, sub - Number(next.discount));
      return next;
    });
  };

  const finalizePayment = async (mode: string) => {
    if (!selectedApt) return;
    setPaying(true);
    setPaymentStatusText('Processing Settlement...');

    const txnId = mode.includes('Cash') 
      ? `CASH-${Date.now().toString().slice(-6)}` 
      : `UPI-TXN-${Date.now().toString().slice(-6)}`;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const patientId = selectedApt.patient?.id || selectedApt.patientId;

      if (mode.includes('Cash')) {
        if (patientId) {
          await fetch(`${BACKEND_URL}/billing/consolidated/${patientId}/settle`, {
            method: 'POST', headers, credentials: 'include',
            body: JSON.stringify({ paymentMethod: 'CASH', amount: bill.net, appointmentId: selectedApt.id }),
          }).catch(() => {});
        }
      }

      await fetch(`${BACKEND_URL}/appointments/${selectedApt.id}/status`, {
        method: 'PATCH', headers, credentials: 'include',
        body: JSON.stringify({ status: 'PAID', paymentStatus: 'PAID', isPaid: true }),
      }).catch(() => {});

      if (!mode.includes('Cash')) {
        const orderRes = await fetch(`${BACKEND_URL}/payments/create-order`, {
          method: 'POST', headers, credentials: 'include', body: JSON.stringify({ billId: selectedApt.id, amount: bill.net })
        });
        const orderData = await orderRes.json();
        if (!orderData.success) throw new Error('Failed to create secure payment order');

        if (!(window as any).Razorpay) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            document.body.appendChild(script);
          });
        }

        const options = {
          key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
          name: 'DrBlooMedi Hospital', description: `Consultation & Services - Token ${selectedApt.appointmentNumber}`, order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`${BACKEND_URL}/payments/verify`, {
                method: 'POST', headers, credentials: 'include',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature, appointmentId: selectedApt.id, amount: bill.net,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success || verifyRes.ok) {
                await fetch(`${BACKEND_URL}/appointments/${selectedApt.id}/status`, {
                  method: 'PATCH', headers, credentials: 'include',
                  body: JSON.stringify({ status: 'PAID', paymentStatus: 'PAID', isPaid: true }),
                }).catch(() => {});

                setReceipt({ 
                  patient: selectedApt.patient, 
                  appointmentNumber: selectedApt.appointmentNumber, 
                  bill: { ...bill }, 
                  txnId: response.razorpay_payment_id, 
                  mode: 'Razorpay Secure Online Gateway' 
                });
                setSelectedApt(null); 
                fetchData();
              } else { showToast('Payment verification failed on server!', 'error'); }
            } catch { showToast('Error connecting during verification', 'error'); }
            finally { setPaying(false); }
          },
          prefill: { name: selectedApt.patient?.fullName || 'Patient', contact: selectedApt.patient?.phone || '' },
          theme: { color: '#2563eb' },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (r: any) => { showToast(`Payment failed: ${r.error.description}`, 'error'); setPaying(false); });
        rzp.open();
        setPaying(false);
        return;
      }

      setReceipt({ 
        patient: selectedApt.patient, 
        appointmentNumber: selectedApt.appointmentNumber, 
        bill: { ...bill }, 
        txnId, 
        mode: 'Cash Counter' 
      });

      setSelectedApt(null); 
      setPaying(false);
      fetchData();
    } catch (err: any) {
      setPaying(false);
      showToast(err.message || 'Could not initialize payment settlement.', 'error');
    }
  };

  const analytics = useMemo(() => {
    let rev = 0;
    
    billingRecords.forEach(b => {
      const st = String(b.status || b.paymentStatus || '').trim().toUpperCase();
      if (st === 'PAID' || st === 'SUCCESS' || st === 'COMPLETED') {
        rev += Number(b.amount || b.netAmount || b.totalAmount || 0);
      }
    });

    const discharged = billingRecords.filter(b => {
      const st = String(b.status || b.paymentStatus || '').trim().toUpperCase();
      return st === 'PAID' || st === 'SUCCESS' || st === 'COMPLETED';
    }).length;

    let pending = 0;
    appointments.forEach(a => {
      const status = String(a.status || '').trim().toUpperCase();
      const paymentStatus = String(a.paymentStatus || '').trim().toUpperCase();
      const isPaid = a.isPaid === true || ['PAID', 'SUCCESS', 'DISCHARGED'].includes(paymentStatus) || ['PAID', 'SUCCESS', 'DISCHARGED'].includes(status);

      if (!isPaid && status === 'COMPLETED') {
        pending++;
      }
    });

    return { 
      total: appointments.length, 
      rev, 
      discharged: Math.max(discharged, appointments.filter(a => ['PAID', 'SUCCESS', 'DISCHARGED'].includes(String(a.status || '').toUpperCase())).length), 
      pending 
    };
  }, [appointments, billingRecords]);

  const list = useMemo(() => {
    const paidAppointmentIds = new Set(billingRecords.map(b => String(b.appointmentId || b.billId || '')));

    return appointments.filter(a => {
      const status = String(a.status || '').trim().toUpperCase();
      const paymentStatus = String(a.paymentStatus || '').trim().toUpperCase();
      
      if (paidAppointmentIds.has(String(a.id)) || a.isPaid || ['PAID', 'SUCCESS', 'DISCHARGED'].includes(paymentStatus) || ['PAID', 'SUCCESS', 'DISCHARGED'].includes(status)) {
        return false;
      }
      
      if (status !== 'COMPLETED') return false;

      const q = search.toLowerCase();
      return (a.patient?.fullName || '').toLowerCase().includes(q) || (a.patient?.phone || '').includes(q) || (a.appointmentNumber || '').toLowerCase().includes(q);
    });
  }, [appointments, billingRecords, search]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans text-slate-900 dark:text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-6 relative overflow-hidden transition-colors">
      
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-blue-600/10 dark:bg-blue-950/20 rounded-full blur-[130px] pointer-events-none"></div>

      {liveAlert && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs rounded-2xl font-bold flex justify-between items-center shadow-xl animate-bounce border border-emerald-400/30">
          <span>🔔 {liveAlert}</span>
          <button onClick={() => setLiveAlert(null)} className="bg-white/20 px-2.5 py-0.5 rounded-lg cursor-pointer">✕</button>
        </div>
      )}

      <div className="bg-white dark:bg-[#111827] backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Reception & Discharge Terminal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Live Counter & Billing Queue</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData()} className="px-4 py-2.5 bg-slate-100 dark:bg-[#1f2937] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition shadow-xs cursor-pointer">🔄 Refresh</button>
          <button onClick={() => performLogout('Logged out successfully.')} className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 transition shadow-xs cursor-pointer">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">Total Patients</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{analytics.total}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{analytics.rev}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Discharged</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{analytics.discharged}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Pending Settlement</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{analytics.pending}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-4 bg-white dark:bg-[#111827] backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Walk-in Patient Token Issue</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Instant counter registration & queue assignment</p>
          </div>

          <form onSubmit={handleWalkinSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Mobile Number *</label>
              <input
                type="text"
                placeholder="10-digit phone (auto-detects patient)"
                value={walkinForm.phone}
                onChange={e => handlePhoneChange(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Patient Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kulkarni"
                value={walkinForm.fullName}
                onChange={e => setWalkinForm({ ...walkinForm, fullName: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Age</label>
                <input
                  type="number"
                  placeholder="35"
                  value={walkinForm.age}
                  onChange={e => setWalkinForm({ ...walkinForm, age: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Gender</label>
                <select
                  value={walkinForm.gender}
                  onChange={e => setWalkinForm({ ...walkinForm, gender: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                >
                  <option value="Male" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Male</option>
                  <option value="Female" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Female</option>
                  <option value="Other" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Assign Specialist</label>
              <select
                value={walkinForm.specialist}
                onChange={e => setWalkinForm({ ...walkinForm, specialist: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
              >
                <option value="General Physician" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">General Physician</option>
                <option value="Cardiologist" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Cardiologist</option>
                <option value="Orthopedic" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Orthopedic</option>
                <option value="Pediatrician" className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white">Pediatrician</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Time Slot</label>
                <input
                  type="text"
                  value={walkinForm.slot}
                  onChange={e => setWalkinForm({ ...walkinForm, slot: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Consult Reason</label>
                <input
                  type="text"
                  value={walkinForm.reason}
                  onChange={e => setWalkinForm({ ...walkinForm, reason: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition mt-2 disabled:opacity-50 cursor-pointer"
            >
              {registering ? 'Issuing Token...' : '⚡ Generate Token & Assign Queue'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-[#111827] backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">OPD & Consultation Queue</h2>
            <input 
              type="text" 
              placeholder="Search patient name, phone, token..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full sm:w-72 p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Token</th>
                  <th className="py-3 px-2">Patient Name</th>
                  <th className="py-3 px-2">Mobile No</th>
                  <th className="py-3 px-2">Slot</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Billing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-mono">Synchronizing live queue...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">No active pending appointments found.</td></tr>
                ) : (
                  list.map(a => {
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-[#1f2937]/50 transition">
                        <td className="py-3.5 px-2 font-mono font-bold text-blue-600 dark:text-blue-400">{a.appointmentNumber || 'APT'}</td>
                        <td className="py-3.5 px-2 font-bold text-slate-900 dark:text-white">{a.patient?.fullName || 'Walk-in'}</td>
                        <td className="py-3.5 px-2 text-slate-500 dark:text-slate-400 font-mono">{a.patient?.phone || 'N/A'}</td>
                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-300">{a.timeSlot || '10:00 AM'}</td>
                        <td className="py-3.5 px-2 text-center">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            {a.status || 'Completed'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button 
                            onClick={() => openBilling(a)} 
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold shadow-md transition active:scale-95 cursor-pointer"
                          >
                            💳 Settle Bill
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {selectedApt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end transition-all">
          <div className="bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-full uppercase">
                    Discharge & Billing Sidebar
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">{selectedApt.patient?.fullName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Token: {selectedApt.appointmentNumber} • {selectedApt.patient?.phone}</p>
                </div>
                <button onClick={() => setSelectedApt(null)} aria-label="Close billing drawer" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold transition-colors cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Consultation Fee</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={bill.consult} onChange={e => updateBill('consult', Number(e.target.value))} className="w-full p-2.5 pl-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-right text-slate-800 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <div>
                    <span className="text-slate-700 dark:text-slate-300 block font-medium">Pathology / Lab Tests</span>
                    {bill.testNames.length > 0 && <span className="text-[10px] text-slate-400">{bill.testNames.join(', ')}</span>}
                  </div>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={bill.lab} onChange={e => updateBill('lab', Number(e.target.value))} className="w-full p-2.5 pl-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-right text-slate-800 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Procedures & Treatment</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={bill.treatment || ''} placeholder="0" onChange={e => updateBill('treatment', Number(e.target.value))} className="w-full p-2.5 pl-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-right text-slate-800 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Pharmacy Medicines</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={bill.pharma || ''} placeholder="0" onChange={e => updateBill('pharma', Number(e.target.value))} className="w-full p-2.5 pl-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-right text-slate-800 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Discount / Concession</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={bill.discount || ''} placeholder="0" onChange={e => updateBill('discount', Number(e.target.value))} className="w-full p-2.5 pl-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-right text-slate-800 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Net Payable Amount</span>
                <span className="text-emerald-400 font-black text-2xl font-mono">₹{bill.net}.00</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Select Payment Settlement Mode</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  disabled={paying} 
                  onClick={() => finalizePayment('Razorpay Online')} 
                  className="py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-blue-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  ⚡ Razorpay Online
                </button>
                <button 
                  disabled={paying} 
                  onClick={() => finalizePayment('Cash Counter')} 
                  className="py-3.5 bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  💵 Cash Counter
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="text-center space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center font-bold text-base shadow-xs">✓</span>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Settled Successfully</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">DrBlooMedi Official Invoice</p>
            </div>
            
            <div className="space-y-2 bg-slate-50 dark:bg-[#1f2937] p-4 rounded-2xl text-xs border border-slate-100/80 dark:border-slate-800">
              <div className="flex justify-between"><span className="text-slate-500">Patient:</span><strong className="text-slate-900 dark:text-white">{receipt.patient?.fullName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Token No:</span><span className="font-mono font-semibold">{receipt.appointmentNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transaction ID:</span><span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{receipt.txnId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Settlement Mode:</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{receipt.mode}</span></div>
              <div className="border-t border-slate-200/60 dark:border-slate-700 pt-2 flex justify-between font-black text-sm">
                <span className="text-slate-700 dark:text-slate-300">Net Total:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{receipt.bill.net}.00</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl font-bold text-xs transition cursor-pointer">🖨️ Print Receipt</button>
              <button onClick={() => setReceipt(null)} className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs transition cursor-pointer shadow-md shadow-blue-600/20">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}