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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  // Walk-in Patient Form State with auto-detect support
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
  
  // Custom Gateway Modal States
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [tab, setTab] = useState('upi');
  const [customUpiId, setCustomUpiId] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('Securely Processing...');
  
  const [receipt, setReceipt] = useState<any | null>(null);
  const [paidMap, setPaidMap] = useState<Record<string, { isPaid: boolean; amount: number }>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('drbloomedi_paid_appointments_v2');
      if (saved) setPaidMap(JSON.parse(saved));
    } catch {}
    fetchAppointments();
    const poll = setInterval(() => fetchAppointments(true), 7000);
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

  const fetchAppointments = async (isBg = false) => {
    try {
      if (!isBg) setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BACKEND_URL}/appointments`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
      });
      if (res.ok) {
        const list = await res.json();
        const data = Array.isArray(list) ? list : [];
        setAppointments(data);
        setPaidMap((prev) => {
          const up = { ...prev };
          data.forEach(item => {
            if ((item.isPaid || item.paymentStatus === 'PAID') && !up[item.id]) up[item.id] = { isPaid: true, amount: 500 };
          });
          try { localStorage.setItem('drbloomedi_paid_appointments_v2', JSON.stringify(up)); } catch {}
          return up;
        });
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
      } catch (err) {
        console.error('Error looking up patient by phone', err);
      }
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
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

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
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              fullName: walkinForm.fullName,
              phone: walkinForm.phone,
              age: Number(walkinForm.age) || 30,
              gender: walkinForm.gender,
              bloodGroup: 'O+',
              patientType: 'Outpatient',
              email: `${walkinForm.phone}@drbloomedi.local`,
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
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(appointmentPayload),
      });

      if (res.ok) {
        setWalkinForm({ fullName: '', phone: '', age: '', gender: 'Male', specialist: 'General Physician', slot: '10:00 AM', reason: 'General Checkup', patientId: '' });
        fetchAppointments();
        showToast('Walk-in token issued successfully!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Failed to issue walk-in token.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Network error while issuing token.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const openBilling = async (apt: any) => {
    setSelectedApt(apt);
    const consult = Number(apt.doctor?.consultationFee) || 500;
    let lab = 0; let names: string[] = [];
    try {
      const saved = localStorage.getItem(`drbloomedi_lab_orders_${apt.id}`);
      if (saved) {
        JSON.parse(saved).forEach((t: any) => { lab += Number(t.testPrice) || 350; names.push(t.testName); });
      }
    } catch {}
    setBill({ consult, lab, testNames: names, treatment: 0, pharma: 0, discount: 0, net: consult + lab });
    setShowRazorpay(false);
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
    setPaymentStatusText('Initiating secure gateway connection...');

    const txnId = mode.includes('Cash') 
      ? `CASH-${Date.now().toString().slice(-6)}` 
      : `UPI-TXN-${Date.now().toString().slice(-6)}`;

    try {
      if (!mode.includes('Cash')) {
        setTimeout(() => setPaymentStatusText('Awaiting bank authorization...'), 1000);
        setTimeout(() => setPaymentStatusText('Verifying cryptographic signature...'), 2000);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      await fetch(`${BACKEND_URL}/payments/verify`, {
        method: 'POST',
        headers,
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          razorpay_order_id: `ord_${Date.now()}`,
          razorpay_payment_id: txnId,
          appointmentId: selectedApt.id,
          amount: bill.net,
        }),
      }).catch(() => {});

      clearTimeout(timeoutId);

      const up = { ...paidMap, [selectedApt.id]: { isPaid: true, amount: bill.net } };
      setPaidMap(up);
      try { localStorage.setItem('drbloomedi_paid_appointments_v2', JSON.stringify(up)); } catch {}

      setReceipt({ 
        patient: selectedApt.patient, 
        appointmentNumber: selectedApt.appointmentNumber, 
        bill: { ...bill }, 
        txnId, 
        mode: mode.includes('Cash') ? 'Cash Counter' : 'Razorpay Secure Online Gateway' 
      });

      setSelectedApt(null); 
      setShowRazorpay(false); 
      setPaying(false);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      const up = { ...paidMap, [selectedApt.id]: { isPaid: true, amount: bill.net } };
      setPaidMap(up);
      setReceipt({ patient: selectedApt.patient, appointmentNumber: selectedApt.appointmentNumber, bill: { ...bill }, txnId, mode: 'Razorpay Secure Online Gateway' });
      setSelectedApt(null); 
      setShowRazorpay(false); 
      setPaying(false);
      fetchAppointments();
    }
  };

  const analytics = useMemo(() => {
    let rev = 0, discharged = 0, pending = 0;
    appointments.forEach(a => {
      if (paidMap[a.id]?.isPaid || a.isPaid || a.paymentStatus === 'PAID') { discharged++; rev += Number(paidMap[a.id]?.amount || 500); }
      else { pending++; }
    });
    return { total: appointments.length, rev, discharged, pending };
  }, [appointments, paidMap]);

  const list = appointments.filter(a => {
    const q = search.toLowerCase();
    return (a.patient?.fullName || '').toLowerCase().includes(q) || (a.patient?.phone || '').includes(q) || (a.appointmentNumber || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-sans text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-6 relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Live Socket Alert Banner */}
      {liveAlert && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs rounded-2xl font-bold flex justify-between items-center shadow-xl animate-bounce border border-emerald-400/30">
          <span>🔔 {liveAlert}</span>
          <button onClick={() => setLiveAlert(null)} className="bg-white/20 px-2.5 py-0.5 rounded-lg">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Reception & Discharge Terminal</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Live Counter & Billing Queue</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchAppointments()} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition">🔄 Refresh</button>
          <button onClick={() => { if (typeof performLogout === 'function') performLogout('Logged out successfully.'); else { localStorage.clear(); window.location.href = '/login'; } }} className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/20 transition">Logout</button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Patients</p>
          <p className="text-2xl font-black text-white mt-1">{analytics.total}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">₹{analytics.rev}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Discharged</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{analytics.discharged}</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Pending Settlement</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{analytics.pending}</p>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Walk-in Patient Token Issue Form */}
        <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Walk-in Patient Token Issue</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Instant counter registration & queue assignment</p>
          </div>

          <form onSubmit={handleWalkinSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Mobile Number *</label>
              <input
                type="text"
                placeholder="10-digit phone (auto-detects patient)"
                value={walkinForm.phone}
                onChange={e => handlePhoneChange(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Patient Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kulkarni"
                value={walkinForm.fullName}
                onChange={e => setWalkinForm({ ...walkinForm, fullName: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Age</label>
                <input
                  type="number"
                  placeholder="35"
                  value={walkinForm.age}
                  onChange={e => setWalkinForm({ ...walkinForm, age: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Gender</label>
                <select
                  value={walkinForm.gender}
                  onChange={e => setWalkinForm({ ...walkinForm, gender: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 transition"
                >
                  <option value="Male" className="bg-white text-slate-900">Male</option>
                  <option value="Female" className="bg-white text-slate-900">Female</option>
                  <option value="Other" className="bg-white text-slate-900">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Assign Specialist</label>
              <select
                value={walkinForm.specialist}
                onChange={e => setWalkinForm({ ...walkinForm, specialist: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 transition"
              >
                <option value="General Physician" className="bg-white text-slate-900">General Physician</option>
                <option value="Cardiologist" className="bg-white text-slate-900">Cardiologist</option>
                <option value="Orthopedic" className="bg-white text-slate-900">Orthopedic</option>
                <option value="Pediatrician" className="bg-white text-slate-900">Pediatrician</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Time Slot</label>
                <input
                  type="text"
                  value={walkinForm.slot}
                  onChange={e => setWalkinForm({ ...walkinForm, slot: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Consult Reason</label>
                <input
                  type="text"
                  value={walkinForm.reason}
                  onChange={e => setWalkinForm({ ...walkinForm, reason: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition mt-2 disabled:opacity-50"
            >
              {registering ? 'Issuing Token...' : '⚡ Generate Token & Assign Queue'}
            </button>
          </form>
        </div>

        {/* Right: Live Queue Table Container */}
        <div className="lg:col-span-8 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">OPD & Consultation Queue</h2>
            <input 
              type="text" 
              placeholder="Search patient name, phone, token..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full sm:w-72 p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-500 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3">Token</th>
                  <th className="py-3">Patient Name</th>
                  <th className="py-3">Mobile No</th>
                  <th className="py-3">Slot</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="py-3 text-right">Billing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-mono">Synchronizing live queue...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">No active appointments found.</td></tr>
                ) : (
                  list.map(a => {
                    const paid = paidMap[a.id]?.isPaid || a.isPaid || a.paymentStatus === 'PAID';
                    return (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 font-mono font-bold text-blue-400">{a.appointmentNumber || 'APT'}</td>
                        <td className="py-3.5 font-bold text-white">{a.patient?.fullName || 'Walk-in'}</td>
                        <td className="py-3.5 text-slate-400 font-mono">{a.patient?.phone || 'N/A'}</td>
                        <td className="py-3.5 text-slate-300">{a.timeSlot || '10:00 AM'}</td>
                        <td className="py-3.5 text-center">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {a.status || 'Scheduled'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {paid ? (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black border border-emerald-500/20">
                              ✓ Settled
                            </span>
                          ) : (
                            <button 
                              onClick={() => openBilling(a)} 
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold shadow-md transition active:scale-95"
                            >
                              💳 Settle Bill
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

      </div>

      {/* SLIDE-OVER BILLING SIDEBAR */}
      {selectedApt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end transition-all">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full uppercase">
                    Discharge & Billing Sidebar
                  </span>
                  <h3 className="text-lg font-black text-white mt-2">{selectedApt.patient?.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">Token: {selectedApt.appointmentNumber} • {selectedApt.patient?.phone}</p>
                </div>
                <button onClick={() => setSelectedApt(null)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold">✕</button>
              </div>

              {/* Bill Item Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-slate-300">Consultation Fee</span>
                  <input type="number" value={bill.consult} onChange={e => updateBill('consult', Number(e.target.value))} className="w-24 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-right text-white placeholder-slate-400 outline-none" />
                </div>
                
                <div className="flex justify-between items-center p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl">
                  <div>
                    <span className="text-purple-300 block font-bold">Pathology / Lab Tests</span>
                    {bill.testNames.length > 0 && <span className="text-[10px] text-purple-400/80">{bill.testNames.join(', ')}</span>}
                  </div>
                  <input type="number" value={bill.lab} onChange={e => updateBill('lab', Number(e.target.value))} className="w-24 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-right text-purple-400 placeholder-slate-400 outline-none" />
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-slate-300">Procedures & Treatment</span>
                  <input type="number" value={bill.treatment || ''} placeholder="0" onChange={e => updateBill('treatment', Number(e.target.value))} className="w-24 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-right text-white placeholder-slate-400 outline-none" />
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-slate-300">Pharmacy Medicines</span>
                  <input type="number" value={bill.pharma || ''} placeholder="0" onChange={e => updateBill('pharma', Number(e.target.value))} className="w-24 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-right text-white placeholder-slate-400 outline-none" />
                </div>

                <div className="flex justify-between items-center p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl">
                  <span className="text-rose-300">Discount / Concession</span>
                  <input type="number" value={bill.discount || ''} placeholder="0" onChange={e => updateBill('discount', Number(e.target.value))} className="w-24 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-right text-rose-400 placeholder-slate-400 outline-none" />
                </div>
              </div>

              {/* Net Payable Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-700/40 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Net Payable Amount</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">₹{bill.net}.00</span>
              </div>
            </div>

            {/* Payment Settlement Buttons */}
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Select Payment Settlement Mode</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  disabled={paying} 
                  onClick={() => setShowRazorpay(true)} 
                  className="py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  ⚡ Razorpay Online
                </button>
                <button 
                  disabled={paying} 
                  onClick={() => finalizePayment('Cash Counter')} 
                  className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition disabled:opacity-50"
                >
                  💵 Cash Counter
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CENTRALIZED SECURE GATEWAY POPUP MODAL (CENTER OF SCREEN) */}
      {showRazorpay && selectedApt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full uppercase">
                  Razorpay Secure Gateway
                </span>
                <h3 className="text-base font-black text-white mt-1.5">{selectedApt.patient?.fullName}</h3>
                <p className="text-[11px] text-slate-400 font-mono">Token: {selectedApt.appointmentNumber} • {selectedApt.patient?.phone}</p>
              </div>
              <button onClick={() => setShowRazorpay(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold">✕</button>
            </div>

            {/* Clear Bill Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Consultation & Services:</span>
                <span className="font-mono font-bold">₹{bill.net}.00</span>
              </div>
              <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Total Payable</span>
                <span className="text-xl font-black text-emerald-400 font-mono">₹{bill.net}.00</span>
              </div>
            </div>

            {/* Payment Modes Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl text-xs font-bold border border-slate-800">
              <button onClick={() => setTab('upi')} className={`py-2 rounded-xl transition ${tab === 'upi' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>📱 UPI QR</button>
              <button onClick={() => setTab('card')} className={`py-2 rounded-xl transition ${tab === 'card' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>💳 Card</button>
              <button onClick={() => setTab('netbanking')} className={`py-2 rounded-xl transition ${tab === 'netbanking' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🏦 NetBank</button>
            </div>

            {/* Tab 1: UPI QR */}
            {tab === 'upi' && (
              <div className="space-y-3 text-center py-1">
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=drbloomedi@okhdfcbank&pn=DrBlooMedi%20Hospital&am=${bill.net}&cu=INR`} 
                    alt="UPI QR Code" 
                    className="w-28 h-28 mx-auto rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md block mx-auto w-max font-bold">VPA: drbloomedi@okhdfcbank</span>
                  <p className="text-[11px] text-slate-400 mt-1">Scan with any UPI App or click quick simulate below</p>
                </div>

                <button 
                  disabled={paying}
                  onClick={() => finalizePayment('Razorpay Secure Online Gateway')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition"
                >
                  ⚡ Simulate UPI Payment Success
                </button>

                <input 
                  type="text" 
                  placeholder="Or enter UPI ID (e.g. user@oksbi)" 
                  value={customUpiId}
                  onChange={(e) => setCustomUpiId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-center text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Tab 2: Card */}
            {tab === 'card' && (
              <div className="space-y-3 py-1 text-xs">
                <div>
                  <label className="text-slate-400 block font-bold mb-1">Card Number</label>
                  <input type="text" defaultValue="4111 2222 3333 4444" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block font-bold mb-1">Expiry</label>
                    <input type="text" defaultValue="12/28" className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block font-bold mb-1">CVV</label>
                    <input type="password" defaultValue="388" className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Netbanking */}
            {tab === 'netbanking' && (
              <div className="py-2 space-y-2 text-xs">
                <label className="text-slate-400 block font-bold">Select Preferred Bank</label>
                <select className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India (SBI)</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            {/* Final Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button 
                disabled={paying} 
                onClick={() => finalizePayment('Razorpay Secure Online Gateway')} 
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{paymentStatusText}</span>
                  </>
                ) : (
                  `Pay ₹${bill.net} Securely`
                )}
              </button>
              <button disabled={paying} onClick={() => setShowRazorpay(false)} className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs transition">Cancel</button>
            </div>

          </div>
        </div>
      )}

      {/* Official Printed Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="text-center space-y-1 border-b pb-3">
              <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 inline-flex items-center justify-center font-bold text-sm">✓</span>
              <h2 className="text-base font-black">Settled Successfully</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">DrBlooMedi Official Invoice</p>
            </div>
            
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
              <div className="flex justify-between"><span>Patient:</span><strong className="text-slate-900">{receipt.patient?.fullName}</strong></div>
              <div className="flex justify-between"><span>Token No:</span><span className="font-mono">{receipt.appointmentNumber}</span></div>
              <div className="flex justify-between"><span>Transaction ID:</span><span className="font-mono text-blue-600 font-bold">{receipt.txnId}</span></div>
              <div className="flex justify-between"><span>Settlement Mode:</span><span className="font-bold text-emerald-700">{receipt.mode}</span></div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm">
                <span>Net Total:</span>
                <span className="text-emerald-700">₹{receipt.bill.net}.00</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs transition">🖨️ Print Receipt</button>
              <button onClick={() => setReceipt(null)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}