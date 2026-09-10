'use client';

import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export default function PatientPortalPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [portalMode, setPortalMode] = useState<'verify' | 'new_patient_register' | 'dossier'>('verify');

  const [patient, setPatient] = useState<any | null>(null);
  const [history, setHistory] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [bookingSuccessAlert, setBookingSuccessAlert] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<any[]>([]);

  // New Patient Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [newRegDate, setNewRegDate] = useState('');
  const [newRegSlot, setNewRegSlot] = useState('10:00 AM');
  const [registering, setRegistering] = useState(false);

  // Existing Patient Booking Form State
  const [existingDoctorId, setExistingDoctorId] = useState('');
  const [existingDate, setExistingDate] = useState('');
  const [bookingExisting, setBookingExisting] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'rx' | 'lab' | 'bills' | 'book'>('overview');

  const [viewRx, setViewRx] = useState<any | null>(null);
  const [viewLabReport, setViewLabReport] = useState<any | null>(null);

  useEffect(() => {
    fetchDoctors();
    const saved = localStorage.getItem('drbloo_active_patient');
    if (saved) {
      try {
        setPatient(parsed);
        setPortalMode('dossier');
        loadDossier(parsed.id);
      } catch (e) {
        localStorage.removeItem('drbloo_active_patient');
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/doctors`);
      if (res.ok) setDoctors(await res.json());
    } catch (err) {
      console.error('Failed to load doctors list', err);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();

    if (!INDIAN_MOBILE_REGEX.test(cleanPhone)) {
      setVerifyError('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    try {
      setVerifying(true);
      setVerifyError('');
      setBookingSuccessAlert(null);

      const res = await fetch(`${BACKEND_URL}/patient-portal/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Verification failed');
      }

      const data = await res.json();

      if (data.exists && data.patient) {
        setPatient(data.patient);
        localStorage.setItem('drbloo_active_patient', JSON.stringify(data.patient));
        setPortalMode('dossier');
        loadDossier(data.patient.id);
        showToast('Welcome back! Patient records loaded securely.');
      } else {
        setPortalMode('new_patient_register');
      }
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const loadDossier = async (patientId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`${BACKEND_URL}/patient-portal/history/${patientId}`);
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error('Failed to load history dossier', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetRegistrationForm = () => {
    setFullName('');
    setEmail('');
    setAge('');
    setGender('Male');
    setBloodGroup('O+');
    setAddress('');
    setNewRegDoctorId('');
    setNewRegDate('');
    setNewRegSlot('10:00 AM');
  };

  const handleRegisterAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    if (!INDIAN_MOBILE_REGEX.test(cleanPhone)) {
      setVerifyError('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    if (!fullName || !newRegDoctorId || !newRegDate) {
      showToast('⚠️ Please fill all required fields');
      return;
    }

    try {
      setRegistering(true);
      setVerifyError('');
      const res = await fetch(`${BACKEND_URL}/patient-portal/auth/register-and-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email.trim() || `${cleanPhone}@patient.drbloomedi.com`,
          phone: cleanPhone,
          age: Number(age) || 25,
          gender,
          bloodGroup,
          address,
          doctorId: newRegDoctorId,
          appointmentDate: newRegDate,
          timeSlot: newRegSlot,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Registration & Booking failed');
      }

      const data = await res.json();
      setPatient(data.patient);
      localStorage.setItem('drbloo_active_patient', JSON.stringify(data.patient));
      
      resetRegistrationForm();
      setBookingSuccessAlert('Appointment Booked Successfully! Reception desk has received your scheduled token.');
      showToast('✓ Registration successful and token transmitted to reception!');
      
      setPortalMode('dossier');
      loadDossier(data.patient.id);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  const handleExistingBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !existingDoctorId || !existingDate) {
      showToast('⚠️ Please select a doctor and date');
      return;
    }

    try {
      setBookingExisting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BACKEND_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: existingDoctorId,
          appointmentDate: existingDate,
          timeSlot: existingSlot,
          status: 'SCHEDULED',
        }),
      });

      if (!res.ok) throw new Error('Appointment booking failed');

      setBookingSuccessAlert('New Appointment Scheduled! Reception Desk counter has been updated.');
      showToast('✓ Appointment successfully queued!');
      
      setExistingDoctorId('');
      setExistingDate('');
      setActiveTab('appointments');
      loadDossier(patient.id);
    } catch (err: any) {
      showToast(`Booking Error: ${err.message}`);
    } finally {
      setBookingExisting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('drbloo_active_patient');
    setPatient(null);
    setHistory(null);
    setPhoneInput('');
    setPortalMode('verify');
    setBookingSuccessAlert(null);
    showToast('Logged out successfully.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-sans text-slate-100 relative overflow-hidden py-8 px-4 sm:px-6">
      
      {/* Background Animated Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border border-blue-400/30 animate-bounce flex items-center gap-2">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* 1. PHONE VERIFY SCREEN */}
      {portalMode === 'verify' && (
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="bg-slate-900/80 backdrop-blur-2xl max-w-md w-full p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6 transition-all duration-500 hover:border-slate-700">
            <div className="text-center space-y-3">
              <span className="inline-block text-[10px] font-black px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full uppercase tracking-widest">
                Patient Self-Service Portal
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Welcome to DrBlooMedi
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your 10-digit mobile number to access your secure medical dossier or schedule OPD visits.
              </p>
            </div>

            {verifyError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl font-semibold flex items-center gap-2 animate-shake">
                <span>⚠️</span> {verifyError}
              </div>
            )}

            <form onSubmit={handleVerifyPhone} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                  Mobile Number (10 Digits) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-500">📱</span>
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    required
                    placeholder="e.g. 9876543210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl font-bold text-white text-sm outline-none focus:border-blue-500 transition shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
              >
                {verifying ? 'Verifying Identity...' : 'Verify Mobile Number →'}
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-500">
              ⚡ Real-time synchronization with Reception desk queue.
            </p>
          </div>
        </div>
      )}

      {/* 2. NEW PATIENT REGISTRATION FORM */}
      {portalMode === 'new_patient_register' && (
        <div className="min-h-[85vh] flex items-center justify-center py-6">
          <div className="bg-slate-900/90 backdrop-blur-2xl max-w-lg w-full p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-5 animate-in fade-in duration-300">
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-wider">
                  New Patient Profile
                </span>
                <h1 className="text-xl font-black text-white mt-1.5">Quick Registration & Booking</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified Mobile: <span className="font-bold text-blue-400">{phoneInput}</span>
                </p>
              </div>
              <button
                onClick={() => setPortalMode('verify')}
                className="text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>

            {verifyError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl font-semibold flex items-center gap-2 animate-shake">
                <span>⚠️</span> {verifyError}
              </div>
            )}

            <form onSubmit={handleRegisterAndBook} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                  >
                    <option value="Male" className="bg-slate-900">Male</option>
                    <option value="Female" className="bg-slate-900">Female</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                  >
                    <option value="O+" className="bg-slate-900">O+</option>
                    <option value="A+" className="bg-slate-900">A+</option>
                    <option value="B+" className="bg-slate-900">B+</option>
                    <option value="AB+" className="bg-slate-900">AB+</option>
                    <option value="O-" className="bg-slate-900">O-</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Select Specialist & Slot
                </span>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Doctor / Specialist *</label>
                  <select
                    required
                    value={newRegDoctorId}
                    onChange={(e) => setNewRegDoctorId(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                  >
                    <option value="" className="bg-slate-900">-- Choose Specialist --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900">
                        Dr. {d.user?.fullName || d.specialization} (Fee: ₹{d.consultationFee || 500})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={newRegDate}
                      onChange={(e) => setNewRegDate(e.target.value)}
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Slot</label>
                    <select
                      value={newRegSlot}
                      onChange={(e) => setNewRegSlot(e.target.value)}
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                    >
                      <option value="10:00 AM" className="bg-slate-900">10:00 AM</option>
                      <option value="11:30 AM" className="bg-slate-900">11:30 AM</option>
                      <option value="02:00 PM" className="bg-slate-900">02:00 PM</option>
                      <option value="04:30 PM" className="bg-slate-900">04:30 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition mt-3"
              >
                {registering ? 'Creating Account & Booking...' : 'Complete Registration & Book Slot →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. VERIFIED PATIENT 360° DOSSIER */}
      {portalMode === 'dossier' && (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          {bookingSuccessAlert && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-2xl font-bold flex justify-between items-center shadow-lg">
              <span>✓ {bookingSuccessAlert}</span>
              <button onClick={() => setBookingSuccessAlert(null)} className="text-emerald-400 font-black hover:text-white">✕</button>
            </div>
          )}

          {/* Header Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                Verified Patient Dossier
              </span>
              <h1 className="text-2xl font-black text-white mt-2">
                {history?.profile?.fullName || patient?.fullName}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Phone: <span className="font-bold text-slate-200">{history?.profile?.phone || patient?.phone}</span> • Email: {history?.profile?.email || 'N/A'} • Age: {history?.profile?.age || 'N/A'} • Blood Group: {history?.profile?.bloodGroup || 'O+'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadDossier(patient.id)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700/60 transition shadow-sm"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/20 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Consultations</span>
              <p className="text-2xl font-black text-white mt-1">{history?.summary?.totalVisits || 0}</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Prescriptions</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{history?.summary?.totalPrescriptions || 0}</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Lab Diagnostics</span>
              <p className="text-2xl font-black text-purple-400 mt-1">{history?.summary?.totalLabTests || 0}</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Invoices</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{history?.summary?.totalBills || 0}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
            {[
              { id: 'overview', label: '📊 Timeline' },
              { id: 'appointments', label: `📅 Previous Appointments (${history?.appointments?.length || 0})` },
              { id: 'rx', label: `💊 Prescriptions (${history?.prescriptions?.length || 0})` },
              { id: 'lab', label: `🧪 Lab Reports (${history?.labOrders?.length || 0})` },
              { id: 'bills', label: `💳 Billing History (${history?.bills?.length || 0})` },
              { id: 'book', label: '+ Book New Appointment' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Containers */}
          {activeTab === 'overview' && (
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Latest Consultation & Prescription</h2>
              {history?.prescriptions?.length > 0 ? (
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">Diagnosis: {history.prescriptions[0].diagnosis}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Prescribed on {new Date(history.prescriptions[0].createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewRx(history.prescriptions[0])}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition"
                  >
                    Print Prescription
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No prescriptions recorded yet.</p>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Previous & Scheduled Consultations</h2>
              <div className="divide-y divide-slate-800/80 text-xs">
                {history?.appointments?.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No appointments recorded.</p>
                ) : (
                  history?.appointments?.map((apt: any) => (
                    <div key={apt.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">Dr. {apt.doctor?.user?.fullName || apt.doctor?.specialization || 'Doctor'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(apt.appointmentDate).toLocaleDateString()} • Slot: {apt.timeSlot}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                        {apt.status || 'SCHEDULED'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'rx' && (
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Prescriptions History</h2>
              <div className="divide-y divide-slate-800/80 text-xs">
                {history?.prescriptions?.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No prescriptions found.</p>
                ) : (
                  history?.prescriptions?.map((rx: any) => (
                    <div key={rx.id} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">Diagnosis: {rx.diagnosis || 'Routine Evaluation'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(rx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setViewRx(rx)} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl shadow-md transition">
                        View & Print Rx
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'lab' && (
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Diagnostic & Lab Reports</h2>
              <div className="divide-y divide-slate-800/80 text-xs">
                {history?.labOrders?.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No lab investigations recorded.</p>
                ) : (
                  history?.labOrders?.map((lab: any) => (
                    <div key={lab.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">{lab.labTest?.testName || 'Investigation'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Requested: {new Date(lab.createdAt).toLocaleDateString()}</p>
                      </div>
                      {lab.status === 'COMPLETED' && (
                        <button onClick={() => setViewLabReport(lab)} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-xl shadow-md transition">
                          Download Report
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Billing & Invoices</h2>
              <div className="divide-y divide-slate-800/80 text-xs">
                {history?.bills?.length === 0 ? (
                  <p className="py-6 text-center text-slate-500">No invoices found.</p>
                ) : (
                  history?.bills?.map((bill: any) => (
                    <div key={bill.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-mono font-bold text-white">{bill.invoiceNumber}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(bill.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-400 text-sm">₹{bill.totalAmount || bill.amount}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'book' && (
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl max-w-xl mx-auto space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Book Follow-up Consultation</h2>
              <form onSubmit={handleExistingBook} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Specialist *</label>
                  <select
                    required
                    value={existingDoctorId}
                    onChange={(e) => setExistingDoctorId(e.target.value)}
                    className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                  >
                    <option value="" className="bg-slate-900">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900">
                        Dr. {d.user?.fullName || d.specialization} (Fee: ₹{d.consultationFee || 500})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preferred Date *</label>
                    <input
                      type="date"
                      required
                      value={existingDate}
                      onChange={(e) => setExistingDate(e.target.value)}
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Slot *</label>
                    <select
                      value={existingSlot}
                      onChange={(e) => setExistingSlot(e.target.value)}
                      className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl font-bold text-white outline-none focus:border-blue-500 transition"
                    >
                      <option value="10:00 AM" className="bg-slate-900">10:00 AM</option>
                      <option value="11:30 AM" className="bg-slate-900">11:30 AM</option>
                      <option value="02:00 PM" className="bg-slate-900">02:00 PM</option>
                      <option value="04:30 PM" className="bg-slate-900">04:30 PM</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={bookingExisting} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition">
                  {bookingExisting ? 'Scheduling with Reception...' : 'Confirm Appointment for Reception Desk →'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* PRINT MODALS */}
      {viewRx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full uppercase">
                  Digital E-Prescription
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">DRBLOOMEDI HEALTHCARE</h2>
              </div>
              <button onClick={() => setViewRx(null)} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-full font-bold text-slate-700 transition">
                ✕
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900">Diagnosis: {viewRx.diagnosis}</p>
            <div className="divide-y divide-slate-100 text-xs border border-slate-100 rounded-xl p-3 bg-slate-50">
              {Array.isArray(viewRx.medicines) &&
                viewRx.medicines.map((m: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span className="font-bold text-slate-800">{m.name || m.medicineName}</span>
                    <span className="text-slate-500">{m.dosage} • {m.duration}</span>
                  </div>
                ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition"
              >
                Print Rx
              </button>
              <button
                type="button"
                onClick={() => setViewRx(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewLabReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="border-b-2 border-purple-900 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full uppercase">
                  Verified Lab Report
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">DRBLOOMEDI DIAGNOSTICS</h2>
              </div>
              <button onClick={() => setViewLabReport(null)} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-full font-bold text-slate-700 transition">
                ✕
              </button>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between font-bold">
                <span>Test:</span>
                <span>{viewLabReport.labTest?.testName}</span>
              </div>
              <div className="flex justify-between font-bold text-purple-700 font-mono text-base">
                <span>Result:</span>
                <span>{viewLabReport.resultValue} {viewLabReport.labTest?.unit}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
              >
                Print Report
              </button>
              <button
                type="button"
                onClick={() => setViewLabReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
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