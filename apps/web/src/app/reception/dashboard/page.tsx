'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { performLogout } from '@/utils/logout';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';

export default function ReceptionDashboardPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [bill, setBill] = useState({ consult: 500, lab: 0, testNames: [] as string[], treatment: 0, pharma: 0, discount: 0, net: 500 });
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [tab, setTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [paying, setPaying] = useState(false);
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
    const txnId = `${mode === 'Cash Counter' ? 'CASH' : 'pay'}-${Date.now().toString().slice(-6)}`;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await fetch(`${BACKEND_URL}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ razorpay_order_id: `ord_${Date.now()}`, razorpay_payment_id: txnId, appointmentId: selectedApt.id, amount: bill.net }),
      });
    } catch {}

    const up = { ...paidMap, [selectedApt.id]: { isPaid: true, amount: bill.net } };
    setPaidMap(up);
    try { localStorage.setItem('drbloomedi_paid_appointments_v2', JSON.stringify(up)); } catch {}

    setReceipt({ patient: selectedApt.patient, appointmentNumber: selectedApt.appointmentNumber, bill: { ...bill }, txnId, mode });
    setSelectedApt(null); setShowRazorpay(false); setPaying(false);
    fetchAppointments();
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
    <div className="min-h-screen bg-slate-100/70 p-4 md:p-8 font-sans max-w-7xl mx-auto space-y-5">
      {liveAlert && (
        <div className="p-3 bg-emerald-600 text-white text-xs rounded-2xl font-bold flex justify-between items-center shadow-lg animate-bounce">
          <span>🔔 {liveAlert}</span>
          <button onClick={() => setLiveAlert(null)} className="bg-white/20 px-2 py-0.5 rounded">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">Reception & Discharge Desk</h1>
          <p className="text-xs text-slate-500">Live Counter Sync • Fast Bill Clearance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchAppointments()} className="px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-bold">🔄 Refresh</button>
          <button onClick={() => { if (typeof performLogout === 'function') performLogout(); else { localStorage.clear(); window.location.href = '/login'; } }} className="px-3.5 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-200">Logout</button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-[10px] text-slate-400 font-bold uppercase">Total Patients</p><p className="text-xl font-black text-slate-900">{analytics.total}</p></div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-[10px] text-emerald-600 font-bold uppercase">Revenue</p><p className="text-xl font-black text-emerald-600">₹{analytics.rev}</p></div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-[10px] text-blue-600 font-bold uppercase">Discharged</p><p className="text-xl font-black text-blue-600">{analytics.discharged}</p></div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200"><p className="text-[10px] text-amber-600 font-bold uppercase">Pending</p><p className="text-xl font-black text-amber-600">{analytics.pending}</p></div>
      </div>

      {/* Table */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <input type="text" placeholder="Search patient name, phone, token..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-sm p-3 bg-slate-50 border rounded-2xl text-xs outline-none" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead>
              <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5">Token</th><th className="py-2.5">Patient</th><th className="py-2.5">Phone</th><th className="py-2.5">Slot</th><th className="py-2.5 text-center">Status</th><th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? <tr><td colSpan={6} className="py-6 text-center text-slate-400">Loading...</td></tr> : list.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-slate-400">No appointments found.</td></tr> : list.map(a => {
                const paid = paidMap[a.id]?.isPaid || a.isPaid || a.paymentStatus === 'PAID';
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-bold">{a.appointmentNumber || 'APT'}</td>
                    <td className="py-3 font-bold">{a.patient?.fullName || 'Walk-in'}</td>
                    <td className="py-3 text-slate-500 font-mono">{a.patient?.phone || 'N/A'}</td>
                    <td className="py-3">{a.timeSlot || '10:00 AM'}</td>
                    <td className="py-3 text-center"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{a.status || 'Scheduled'}</span></td>
                    <td className="py-3 text-right">
                      {paid ? <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black">✓ Settled</span> :
                      <button onClick={() => openBilling(a)} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold shadow-xs">💳 Settle</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing Modal */}
      {selectedApt && !showRazorpay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div><h3 className="text-sm font-black">Discharge & Bill Clearance</h3><p className="text-[11px] text-slate-400">{selectedApt.patient?.fullName} (#{selectedApt.appointmentNumber})</p></div>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl"><span>Consultation Fee</span><input type="number" value={bill.consult} onChange={e => updateBill('consult', Number(e.target.value))} className="w-24 p-1.5 bg-white border rounded-lg font-bold text-right" /></div>
              <div className="flex justify-between items-center p-2.5 bg-purple-50 rounded-xl"><span>Lab Tests {bill.testNames.length ? `(${bill.testNames.join(', ')})` : ''}</span><input type="number" value={bill.lab} onChange={e => updateBill('lab', Number(e.target.value))} className="w-24 p-1.5 bg-white border rounded-lg font-bold text-right text-purple-700" /></div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl"><span>Treatment / Procedures</span><input type="number" value={bill.treatment || ''} placeholder="0" onChange={e => updateBill('treatment', Number(e.target.value))} className="w-24 p-1.5 bg-white border rounded-lg font-bold text-right" /></div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl"><span>Pharmacy Medicines</span><input type="number" value={bill.pharma || ''} placeholder="0" onChange={e => updateBill('pharma', Number(e.target.value))} className="w-24 p-1.5 bg-white border rounded-lg font-bold text-right" /></div>
              <div className="flex justify-between items-center p-2.5 bg-rose-50 rounded-xl"><span>Discount / Concession</span><input type="number" value={bill.discount || ''} placeholder="0" onChange={e => updateBill('discount', Number(e.target.value))} className="w-24 p-1.5 bg-white border rounded-lg font-bold text-right text-rose-600" /></div>
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex justify-between items-center"><span className="text-xs font-bold">Net Payable</span><span className="text-xl font-black text-emerald-400">₹{bill.net}.00</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => setShowRazorpay(true)} className="py-3 bg-blue-600 text-white rounded-xl font-bold text-xs">⚡ Razorpay</button>
              <button onClick={() => finalizePayment('Cash Counter')} className="py-3 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs">💵 Cash</button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Modal */}
      {showRazorpay && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center text-xs"><span>Razorpay Sandbox</span><span className="text-emerald-400 font-bold">₹{bill.net}.00</span></div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button onClick={() => setTab('upi')} className={`py-1.5 rounded-lg ${tab === 'upi' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>UPI</button>
                <button onClick={() => setTab('card')} className={`py-1.5 rounded-lg ${tab === 'card' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>Card</button>
                <button onClick={() => setTab('netbanking')} className={`py-1.5 rounded-lg ${tab === 'netbanking' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>NetBank</button>
              </div>
              {tab === 'upi' && <div className="text-center p-3 bg-slate-50 rounded-xl text-slate-500">📱 Scan QR Code<br/><span className="text-[10px] font-mono">drbloomedi@okhdfcbank</span></div>}
              {tab === 'card' && <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600">Card: 4111 •••• •••• 1111</div>}
              {tab === 'netbanking' && <div className="p-3 bg-slate-50 rounded-xl font-bold text-center text-slate-700">HDFC / ICICI / SBI / Axis</div>}
              <div className="flex gap-2">
                <button disabled={paying} onClick={() => finalizePayment('Razorpay Online')} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">{paying ? 'Processing...' : `Pay ₹{bill.net}`}</button>
                <button disabled={paying} onClick={() => setShowRazorpay(false)} className="px-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="text-center space-y-1 border-b pb-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 inline-flex items-center justify-center font-bold">✓</span>
              <h2 className="text-base font-black">Discharge Cleared</h2>
              <p className="text-[10px] text-slate-400">DrBlooMedi Official Invoice</p>
            </div>
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl">
              <div className="flex justify-between"><span>Patient:</span><strong className="text-slate-900">{receipt.patient?.fullName}</strong></div>
              <div className="flex justify-between"><span>Token:</span><span className="font-mono">{receipt.appointmentNumber}</span></div>
              <div className="flex justify-between"><span>Txn ID:</span><span className="font-mono text-blue-600">{receipt.txnId}</span></div>
              <div className="flex justify-between"><span>Mode:</span><span className="font-bold text-emerald-600">{receipt.mode}</span></div>
              <div className="border-t pt-2 flex justify-between font-black text-sm"><span>Total:</span><span>₹{receipt.bill.net}.00</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold">🖨️ Print</button>
              <button onClick={() => setReceipt(null)} className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}