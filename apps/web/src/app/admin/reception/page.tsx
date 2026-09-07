'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function ReceptionPortalPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Walk-in booking state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [doctorId, setDoctorId] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadData();

    // 1. Direct Socket.IO Connection to NestJS Port 4000
    const socket: Socket = io('http://localhost:4000', {
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

    // 2. Real-time Live Event Listener
    socket.on('appointment:new', (newApt: any) => {
      console.log('🔔 [Frontend] REAL-TIME APPOINTMENT RECEIVED:', newApt);

      // Instant Queue Update (No page refresh)
      setAppointments((prev) => {
        // Prevent duplicate if already in state
        const exists = prev.some((item) => item.id === newApt.id);
        if (exists) return prev;
        return [newApt, ...prev];
      });

      // Show Animated Popup Banner
      const pName = newApt.patient?.fullName || 'Walk-in Patient';
      const slot = newApt.timeSlot || '10:00 AM';
      const token = newApt.appointmentNumber || 'OPD';
      
      setLiveAlert(`🔔 NEW BOOKING LIVE: ${pName} (${token}) for ${slot}`);

      // Auto dismiss after 8 seconds
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
        fetch('http://localhost:4000/appointments').then((r) => r.json()),
        fetch('http://localhost:4000/doctors').then((r) => r.json()),
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
      alert('Please fill all mandatory fields');
      return;
    }

    try {
      setBooking(true);
      const res = await fetch('http://localhost:4000/patient-portal/auth/register-and-book', {
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
    } catch (err: any) {
      alert(`Booking Error: ${err.message}`);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans max-w-7xl mx-auto space-y-6">
      {/* Real-time Push Alert Banner */}
      {liveAlert && (
        <div className="p-4 bg-emerald-600 text-white text-xs rounded-2xl font-bold flex justify-between items-center shadow-xl animate-bounce border-2 border-emerald-400">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm tracking-wide">{liveAlert}</span>
          </div>
          <button
            onClick={() => setLiveAlert(null)}
            className="font-black text-white hover:text-emerald-200 bg-white/20 px-2 py-1 rounded-lg"
          >
            DISMISS ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase">
              Module 3 • Reception Central
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
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
              {isConnected ? 'Socket.IO Online (Live Sync)' : 'Connecting Socket...'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Reception OPD & Token Desk</h1>
          <p className="text-xs text-slate-500">
            Real-time multi-counter synchronization with Patient Portal and Doctor Cabins
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold self-start md:self-auto"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Live Queue</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{appointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Scheduled Today</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {appointments.filter((a) => a.status === 'Scheduled' || a.status === 'SCHEDULED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Consultations Done</span>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {appointments.filter((a) => a.status === 'Completed' || a.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Specialists On Duty</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{doctors.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Walk-in Quick Booking Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-slate-900 uppercase">Walk-in Patient Token Issue</h2>
          <form onSubmit={handleWalkInBooking} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Patient Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kulkarni"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="10-digit phone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Age</label>
                <input
                  type="number"
                  placeholder="35"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assign Doctor *</label>
              <select
                required
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
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
              className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-md transition mt-2"
            >
              {booking ? 'Generating Token...' : 'Generate Token & Push Live →'}
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Live OPD Queue Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-xs font-black text-slate-900 uppercase">Live OPD Tokens & Appointments</h2>
            <span className="text-[11px] text-slate-400">Updates live via WebSockets</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">Token / Apt No</th>
                  <th className="py-2.5">Patient Details</th>
                  <th className="py-2.5">Doctor</th>
                  <th className="py-2.5">Time Slot</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading queue data...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No appointments registered today.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {apt.appointmentNumber || 'OPD-REG'}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{apt.patient?.fullName || 'Walk-in'}</p>
                        <p className="text-[10px] text-slate-400">{apt.patient?.phone}</p>
                      </td>
                      <td className="py-3 text-slate-700">
                        Dr. {apt.doctor?.user?.fullName || apt.doctor?.specialization || 'Physician'}
                      </td>
                      <td className="py-3 text-slate-500 font-semibold">{apt.timeSlot || '10:00 AM'}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            apt.status === 'Completed' || apt.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
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
    </div>
  );
}