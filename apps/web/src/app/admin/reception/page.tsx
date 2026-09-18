'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { io, Socket } from 'socket.io-client';

export default function ReceptionPortalPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);


    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [patientGender, setPatientGender] = useState('Male');
    const [doctorId, setDoctorId] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadData();
    const socket: Socket = io('https://drbloomedi-backend.onrender.com', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Frontend] Connected to WebSocket Gateway with ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('⚡ [Frontend] Disconnected from WebSocket');
      setIsConnected(false);
    });
    socket.on('appointment:new', (newApt: any) => {
      console.log('🔔 [Frontend] REAL-TIME APPOINTMENT RECEIVED:', newApt);

    
      setAppointments((prev) => {
        const exists = prev.some((item) => item.id === newApt.id);
        if (exists) return prev;
        return [newApt, ...prev];
      });

  
      const pName = newApt.patient?.fullName || 'Walk-in Patient';
      const slot = newApt.timeSlot || '10:00 AM';
      const token = newApt.appointmentNumber || 'OPD';
      
      setLiveAlert(`🔔 NEW BOOKING LIVE: ${pName} (${token}) for ${slot}`);

      setTimeout(() => {
        setLiveAlert(null);
      }, 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [aptRes, docRes] = await Promise.all([
        fetch('https://drbloomedi-backend.onrender.com/appointments').then((r) => r.json()),
        fetch('https://drbloomedi-backend.onrender.com/doctors').then((r) => r.json()),
      ]);
      setAppointments(Array.isArray(aptRes) ? aptRes : []);
      setDoctors(Array.isArray(docRes) ? docRes : []);
    } catch (err) {
      console.error('Failed to load reception data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWalkInBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !doctorId) {
      showToast('Please fill all mandatory fields', 'error');
      return;
    }

    try {
      setBooking(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/patient-portal/auth/register-and-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: patientName,
          phone: patientPhone,
          age: Number(patientAge) || 30,
          gender: patientGender,
          doctorId,
          appointmentDate: new Date().toISOString().split('T')[0],
          timeSlot,
        }),
      });

      if (!res.ok) throw new Error('Failed to book walk-in patient');

      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setDoctorId('');
      showToast('Walk-in patient registered & token issued successfully!', 'success');
    } catch (err: any) {
      showToast(`Booking Error: ${err.message}`, 'error');
    } finally {
      setBooking(false);
    }
  };

  const field =
    'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            REC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                Reception OPD & Token Desk
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                  isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 animate-pulse'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                  }`}
                ></span>
                {isConnected ? 'Socket Online' : 'Connecting...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time multi-counter synchronization with Patient Portal and Doctor Cabins
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
        >
          <span>↻</span> Refresh
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {liveAlert && (
          <div className="p-4 bg-emerald-600 text-white text-xs rounded-xl font-bold flex justify-between items-center shadow-lg animate-bounce border border-emerald-500">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-xs tracking-wide">{liveAlert}</span>
            </div>
            <button
              onClick={() => setLiveAlert(null)}
              className="font-bold text-white bg-white/20 px-2 py-0.5 rounded text-[11px] cursor-pointer"
            >
              DISMISS ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Live Queue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{appointments.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">
              {appointments.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled Today</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {appointments.filter((a) => a.status === 'Scheduled' || a.status === 'SCHEDULED').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base border border-emerald-200 dark:border-emerald-900 font-mono font-bold">
              ✓
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Consultations Done</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {appointments.filter((a) => a.status === 'Completed' || a.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">
              🩺
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Specialists On Duty</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{doctors.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base border border-purple-200 dark:border-purple-900 font-mono font-bold">
              {doctors.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Walk-in Quick Booking Form */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Walk-in Patient Token Issue
            </h2>
            <form onSubmit={handleWalkInBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className={field}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit phone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className={field}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="35"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className={field}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Assign Doctor *</label>
                <select
                  required
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className={field}
                >
                  <option value="">-- Choose Specialist --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.fullName || d.specialization} (Fee: ₹{d.consultationFee || 500})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className={field}
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={booking}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer mt-2"
              >
                {booking ? 'Generating Token...' : '⚡ Generate Token & Push Live'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live OPD Tokens & Appointments</h2>
              <span className="text-[11px] text-slate-400 font-mono">Updates live via WebSockets</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Token / Apt No</th>
                    <th className="py-2.5 px-3">Patient Details</th>
                    <th className="py-2.5 px-3">Doctor</th>
                    <th className="py-2.5 px-3">Time Slot</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                        Loading queue data...
                      </td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No appointments registered today.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {apt.appointmentNumber || 'OPD-REG'}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 dark:text-white">{apt.patient?.fullName || 'Walk-in'}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{apt.patient?.phone}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          Dr. {apt.doctor?.user?.fullName || apt.doctor?.specialization || 'Physician'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">{apt.timeSlot || '10:00 AM'}</td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border ${
                              apt.status === 'Completed' || apt.status === 'COMPLETED'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                            }`}
                          >
                            {apt.status || 'SCHEDULED'}
                          </span>
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
    </div>
  );
}