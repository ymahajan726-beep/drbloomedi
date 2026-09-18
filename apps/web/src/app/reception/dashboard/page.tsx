'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { performLogout } from '@/utils/logout';
import { useToast } from '@/components/Toast';
import { getAuthHeaders } from '@/utils/session';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';

export default function ReceptionDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDoctorQueue, setSelectedDoctorQueue] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  const [walkinForm, setWalkinForm] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'Male',
    specialist: '',
    doctorId: '',
    slot: '10:00 AM',
    reason: 'General Checkup',
    patientId: '',
  });
  const [registering, setRegistering] = useState(false);

  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [bill, setBill] = useState({
    consult: 500,
    lab: 0,
    testNames: [] as string[],
    treatment: 0,
    pharma: 0,
    discount: 0,
    net: 500,
  });
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
    fetchDoctors();
    const poll = setInterval(() => fetchData(true), 7000);
    return () => clearInterval(poll);
  }, []);

  const fetchDoctors = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/doctors`, {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const activeDocs = data.filter((d: any) => d.isActive !== false);
          setDoctorsList(activeDocs);
          if (!walkinForm.doctorId && activeDocs.length > 0) {
            setWalkinForm((prev) => ({
              ...prev,
              doctorId: activeDocs[0].id,
              specialization: activeDocs[0].specialization || 'General Physician',
            }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctors list:', err);
    }
  };

  useEffect(() => {
    const socket: Socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('appointment:new', (newApt: any) => {
      if (newApt && newApt.id) {
        setAppointments((prev) => {
          const exists = prev.some((i) => String(i.id) === String(newApt.id));
          if (exists) return prev;
          return [newApt, ...prev];
        });
      }

      fetchData(true);

      const patientName = newApt?.patient?.fullName || newApt?.fullName || 'Patient';
      const aptNum = newApt?.appointmentNumber || 'OPD';
      const alertMsg = `⚡ LIVE ARRIVAL: ${patientName} (${aptNum})`;

      setLiveAlert(alertMsg);
      showToast(alertMsg, 'success');

      setTimeout(() => setLiveAlert(null), 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = async (isBg = false) => {
    try {
      if (!isBg) setLoading(true);
      const headers = getAuthHeaders();

      const [aptRes, billRes] = await Promise.all([
        fetch(`${BACKEND_URL}/appointments`, { headers, credentials: 'include' }),
        fetch(`${BACKEND_URL}/billing`, { headers, credentials: 'include' }).catch(() => null),
      ]);

      if (aptRes.ok) {
        const list = await aptRes.json();
        setAppointments(Array.isArray(list) ? list : []);
      }

      if (billRes && billRes.ok) {
        const bList = await billRes.json();
        setBillingRecords(Array.isArray(bList) ? bList : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBg) setLoading(false);
    }
  };

  const handlePhoneChange = async (phoneVal: string) => {
    setWalkinForm((prev) => ({ ...prev, phone: phoneVal }));

    if (phoneVal.length === 10) {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/patients?search=${encodeURIComponent(phoneVal)}`, {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const patients = await res.json();
          if (Array.isArray(patients) && patients.length > 0) {
            const matched = patients.find((p: any) => p.phone === phoneVal);
            if (matched) {
              setWalkinForm((prev) => ({
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
        console.error(err);
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
      const headers = getAuthHeaders();
      let pId = walkinForm.patientId;

      if (!pId) {
        const searchRes = await fetch(`${BACKEND_URL}/patients?search=${encodeURIComponent(walkinForm.phone)}`, {
          headers,
          credentials: 'include',
        });

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

      let doctorId = walkinForm.doctorId;
      if (!doctorId && doctorsList.length > 0) {
        doctorId = doctorsList[0].id;
      }

      const appointmentPayload: any = {
        patientId: pId,
        appointmentDate: new Date().toISOString().split('T')[0],
        timeSlot: walkinForm.slot || '10:00 AM',
        status: 'Scheduled',
        symptoms: walkinForm.reason || 'Walk-in Consultation',
      };

      if (doctorId) {
        appointmentPayload.doctorId = Number(doctorId);
      }

      const res = await fetch(`${BACKEND_URL}/appointments`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(appointmentPayload),
      });

      if (res.ok) {
        const newAppointmentData = await res.json().catch(() => ({}));
        const selectedDocObj = doctorsList.find((d) => String(d.id) === String(doctorId));

        const formattedNewApt = {
          id: newAppointmentData.id || Date.now(),
          appointmentNumber: newAppointmentData.appointmentNumber || `APT-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'Scheduled',
          timeSlot: walkinForm.slot || '10:00 AM',
          appointmentDate: new Date().toISOString().split('T')[0],
          patient: {
            id: pId,
            fullName: walkinForm.fullName,
            phone: walkinForm.phone,
          },
          doctor: selectedDocObj || { consultationFee: 500 },
        };

        setAppointments((prev) => [formattedNewApt, ...prev]);
        setWalkinForm({
          fullName: '',
          phone: '',
          age: '',
          gender: 'Male',
          specialist: '',
          doctorId: doctorsList[0]?.id || '',
          slot: '10:00 AM',
          reason: 'General Checkup',
          patientId: '',
        });

        await fetchData(true);
        showToast('Walk-in token issued & assigned to queue successfully!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Failed to issue walk-in token.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error while issuing token.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const openBilling = async (apt: any) => {
    setSelectedApt(apt);
    const consult = Number(apt.doctor?.consultationFee) || 500;
    setBill({
      consult,
      lab: 0,
      testNames: [],
      treatment: 0,
      pharma: 0,
      discount: 0,
      net: consult,
    });
  };

  const updateBill = (field: string, val: number) => {
    setBill((prev) => {
      const next = { ...prev, [field]: val };
      const sub = Number(next.consult) + Number(next.lab) + Number(next.treatment) + Number(next.pharma);
      next.net = Math.max(0, sub - Number(next.discount));
      return next;
    });
  };

  const finalizePayment = async (mode: string) => {
    if (!selectedApt) return;
    setPaying(true);

    const currentAptId = selectedApt.id;
    const txnId = mode.includes('Cash') ? `CASH-${Date.now().toString().slice(-6)}` : `UPI-TXN-${Date.now().toString().slice(-6)}`;

    try {
      const headers = getAuthHeaders();
      const patientId = selectedApt.patient?.id || selectedApt.patientId;

      if (mode.includes('Cash')) {
        if (!patientId) throw new Error('Patient information is missing for settlement.');

        const settleRes = await fetch(`${BACKEND_URL}/billing/consolidated/${patientId}/settle`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            paymentMethod: 'CASH',
            amount: bill.net,
            appointmentId: currentAptId,
          }),
        });

        const settleData = await settleRes.json().catch(() => ({}));
        if (!settleRes.ok) throw new Error(settleData.message || 'Cash settlement failed on server.');

        await fetchData();
        setReceipt({
          patient: selectedApt.patient,
          appointmentNumber: selectedApt.appointmentNumber,
          bill: { ...bill },
          txnId,
          mode: 'Cash Counter',
        });

        setSelectedApt(null);
        setPaying(false);
        showToast('Bill settled successfully via Cash!', 'success');
        return;
      }

      const orderRes = await fetch(`${BACKEND_URL}/payments/create-order`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          billId: currentAptId,
          amount: bill.net,
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to create secure payment order');
      }

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay payment gateway.'));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DrBlooMedi Hospital',
        description: `Consultation & Services - Token ${selectedApt.appointmentNumber}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/payments/verify`, {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                appointmentId: currentAptId,
                amount: bill.net,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed on server.');
            }

            await fetchData();
            setReceipt({
              patient: selectedApt.patient,
              appointmentNumber: selectedApt.appointmentNumber,
              bill: { ...bill },
              txnId: response.razorpay_payment_id,
              mode: 'Razorpay Secure Online Gateway',
            });

            setSelectedApt(null);
            showToast('Online payment verified and settled successfully!', 'success');
          } catch (err: any) {
            showToast(err.message || 'Error connecting during verification', 'error');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: selectedApt.patient?.fullName || 'Patient',
          contact: selectedApt.patient?.phone || '',
        },
        theme: { color: '#059669' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (r: any) => {
        showToast(`Payment failed: ${r?.error?.description || 'Unknown payment error'}`, 'error');
        setPaying(false);
      });
      rzp.open();
      setPaying(false);
    } catch (err: any) {
      setPaying(false);
      showToast(err.message || 'Could not initialize payment settlement.', 'error');
    }
  };

  const analytics = useMemo(() => {
    let rev = 0;
    billingRecords.forEach((b) => {
      const st = String(b.status || b.paymentStatus || '').trim().toUpperCase();
      if (st === 'PAID' || st === 'SUCCESS' || st === 'COMPLETED') {
        rev += Number(b.amount || b.netAmount || b.totalAmount || 0);
      }
    });

    const paidBillingRecords = billingRecords.filter((b) => {
      const st = String(b.status || b.paymentStatus || '').trim().toUpperCase();
      return st === 'PAID' || st === 'SUCCESS' || st === 'COMPLETED';
    });

    const discharged = paidBillingRecords.length;
    const paidAppointmentIds = new Set(
      paidBillingRecords.map((b) => b.appointmentId || b.appointment?.id).filter(Boolean).map((id: any) => String(id))
    );

    const pending = appointments.filter((a) => {
      const status = String(a.status || '').trim().toUpperCase();
      const isValidStatus = status === 'SCHEDULED' || status === 'COMPLETED' || status === 'PENDING';
      if (!isValidStatus) return false;
      return !paidAppointmentIds.has(String(a.id));
    }).length;

    return { total: appointments.length, rev, discharged, pending };
  }, [appointments, billingRecords]);

  const list = useMemo(() => {
    const paidIds = new Set(
      billingRecords
        .filter((b) => {
          const st = String(b.status || b.paymentStatus || '').trim().toUpperCase();
          return st === 'PAID' || st === 'SUCCESS' || st === 'COMPLETED';
        })
        .map((b) => b.appointmentId || b.appointment?.id)
        .filter(Boolean)
        .map((id: any) => String(id))
    );

    const filtered = appointments.filter((a) => {
      const status = String(a.status || '').trim().toUpperCase();
      if (paidIds.has(String(a.id))) return false;

      const isValidStatus = status === 'SCHEDULED' || status === 'COMPLETED' || status === 'PENDING';
      if (!isValidStatus) return false;

      if (selectedDoctorQueue !== 'ALL') {
        const aptDocId = String(a.doctorId || a.doctor?.id || '');
        if (aptDocId !== String(selectedDoctorQueue)) return false;
      }

      const q = search.toLowerCase();
      return (
        (a.patient?.fullName || '').toLowerCase().includes(q) ||
        (a.patient?.phone || '').includes(q) ||
        (a.appointmentNumber || '').toLowerCase().includes(q)
      );
    });

    return filtered.sort((x, y) => {
      const dateX = new Date(x.createdAt || x.appointmentDate || 0).getTime();
      const dateY = new Date(y.createdAt || y.appointmentDate || 0).getTime();
      if (dateX !== dateY) return dateY - dateY;
      return String(y.id || '').localeCompare(String(x.id || ''));
    });
  }, [appointments, billingRecords, search, selectedDoctorQueue]);

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-12">
      {liveAlert && (
        <div className="bg-emerald-600 text-white text-xs px-6 py-3 font-semibold flex justify-between items-center shadow-md border-b border-emerald-500">
          <span>🔔 {liveAlert}</span>
          <button onClick={() => setLiveAlert(null)} className="bg-white/20 px-2 py-0.5 rounded text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            REC
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Reception & Billing Counter
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Terminal Active • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{isConnected ? 'Socket Online' : 'Connecting...'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>↻</span> Refresh
          </button>

          <button
            onClick={() => performLogout('Logged out successfully.')}
            className="px-3.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Patients</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{analytics.total}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{analytics.rev}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Discharged</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{analytics.discharged}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Settlement</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{analytics.pending}</p>
          </div>
        </div>

        {/* Main Grid: Walk-in Token Registration & Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Walk-in Form */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Walk-in Patient Token Issue</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Instant counter registration & queue assignment</p>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mobile Number *</label>
                <input 
                  type="text" 
                  placeholder="10-digit phone" 
                  value={walkinForm.phone} 
                  onChange={(e) => handlePhoneChange(e.target.value)} 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Patient Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Kulkarni" 
                  value={walkinForm.fullName} 
                  onChange={(e) => setWalkinForm({ ...walkinForm, fullName: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Age</label>
                  <input 
                    type="number" 
                    placeholder="35" 
                    value={walkinForm.age} 
                    onChange={(e) => setWalkinForm({ ...walkinForm, age: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" 
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gender</label>
                  <select 
                    value={walkinForm.gender} 
                    onChange={(e) => setWalkinForm({ ...walkinForm, gender: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Assign Doctor & Specialist *</label>
                <select 
                  value={walkinForm.doctorId} 
                  onChange={(e) => setWalkinForm({ ...walkinForm, doctorId: e.target.value })} 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                >
                  {doctorsList.length === 0 ? (
                    <option value="">No active doctors found</option>
                  ) : (
                    doctorsList.map((doc: any) => {
                      const rawName = doc.user?.fullName || doc.name || '';
                      const cleanName = rawName.replace(/^Dr\.\s*Doctor/i, 'Dr.').replace(/^Doctor/i, 'Dr.').trim();
                      const displayName = cleanName ? (cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`) : 'Doctor';
                      return (
                        <option key={doc.id} value={doc.id}>
                          {displayName} - {doc.specialization || 'General Physician'}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Time Slot</label>
                  <input 
                    type="text" 
                    value={walkinForm.slot} 
                    onChange={(e) => setWalkinForm({ ...walkinForm, slot: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" 
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Consult Reason</label>
                  <input 
                    type="text" 
                    value={walkinForm.reason} 
                    onChange={(e) => setWalkinForm({ ...walkinForm, reason: e.target.value })} 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={registering} 
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition mt-2 disabled:opacity-50 cursor-pointer"
              >
                {registering ? 'Issuing Token...' : '⚡ Generate Token & Assign Queue'}
              </button>
            </form>
          </div>

          {/* OPD Queue List */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">OPD & Consultation Queue</h2>
              <input 
                type="text" 
                placeholder="Search patient name, phone, token..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full sm:w-64 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition" 
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setSelectedDoctorQueue('ALL')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${selectedDoctorQueue === 'ALL' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'}`}
              >
                All Queues
              </button>
              {doctorsList.map((doc: any) => {
                const rawName = doc.user?.fullName || doc.name || '';
                const cleanName = rawName.replace(/^Dr\.\s*Doctor/i, 'Dr.').replace(/^Doctor/i, 'Dr.').trim();
                const displayName = cleanName ? (cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`) : `Dr. #${doc.id}`;
                return (
                  <button 
                    key={doc.id} 
                    type="button" 
                    onClick={() => setSelectedDoctorQueue(String(doc.id))} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${selectedDoctorQueue === String(doc.id) ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'}`}
                  >
                    {displayName} ({doc.specialization || 'General'})
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Mobile No</th>
                    <th className="py-2.5 px-3">Slot</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Billing Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">Synchronizing live queue...</td></tr>
                  ) : list.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-xs">No active pending appointments found.</td></tr>
                  ) : (
                    list.map((a , index) => (
                      <tr key={`${a.id}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{a.appointmentNumber || 'APT'}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{a.patient?.fullName || 'Walk-in'}</td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">{a.patient?.phone || 'N/A'}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">{a.timeSlot || '10:00 AM'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">{a.status || 'Scheduled'}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => openBilling(a)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-2xs transition cursor-pointer">💳 Settle Bill</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Billing Drawer */}
      {selectedApt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end transition-all">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full p-6 sm:p-7 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded uppercase">Billing Drawer</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{selectedApt.patient?.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono">Token: {selectedApt.appointmentNumber} • {selectedApt.patient?.phone}</p>
                </div>
                <button onClick={() => setSelectedApt(null)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span>Consultation Fee</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input type="number" value={bill.consult} onChange={(e) => updateBill('consult', Number(e.target.value))} className="w-full p-2 pl-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-semibold text-right outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span>Pathology / Lab Tests</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input type="number" value={bill.lab} onChange={(e) => updateBill('lab', Number(e.target.value))} className="w-full p-2 pl-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-semibold text-right outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span>Procedures & Treatment</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input type="number" value={bill.treatment || ''} placeholder="0" onChange={(e) => updateBill('treatment', Number(e.target.value))} className="w-full p-2 pl-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-semibold text-right outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span>Pharmacy Medicines</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input type="number" value={bill.pharma || ''} placeholder="0" onChange={(e) => updateBill('pharma', Number(e.target.value))} className="w-full p-2 pl-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-semibold text-right outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span>Discount / Concession</span>
                  <div className="relative w-24 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input type="number" value={bill.discount || ''} placeholder="0" onChange={(e) => updateBill('discount', Number(e.target.value))} className="w-full p-2 pl-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-semibold text-right outline-none" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-2xs">
                <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Net Payable</span>
                <span className="text-emerald-400 font-bold text-xl font-mono">₹{bill.net}.00</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Select Payment Settlement Mode</p>
              <div className="grid grid-cols-2 gap-3">
                <button disabled={paying} onClick={() => finalizePayment('Razorpay Online')} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs transition disabled:opacity-50 cursor-pointer">⚡ Razorpay Online</button>
                <button disabled={paying} onClick={() => finalizePayment('Cash Counter')} className="py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer">💵 Cash Counter</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="text-center space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-900">✓</span>
              <h2 className="text-sm font-bold mt-1">Settled Successfully</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">DrBlooMedi Official Invoice</p>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg text-xs border border-slate-200/80 dark:border-slate-700">
              <div className="flex justify-between"><span className="text-slate-500">Patient:</span><strong>{receipt.patient?.fullName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Token No:</span><span className="font-mono font-semibold">{receipt.appointmentNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transaction ID:</span><span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{receipt.txnId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mode:</span><span className="font-semibold text-emerald-600">{receipt.mode}</span></div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-sm">
                <span>Net Total:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{receipt.bill.net}.00</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg font-semibold text-xs cursor-pointer border border-slate-300 dark:border-slate-700">🖨️ Print Receipt</button>
              <button onClick={() => setReceipt(null)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-2xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}