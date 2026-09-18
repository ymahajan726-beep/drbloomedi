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

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [newRegDoctorId, setNewRegDoctorId] = useState('');
  const [newRegDate, setNewRegDate] = useState('');
  const [newRegSlot, setNewRegSlot] = useState('10:00 AM');
  const [registering, setRegistering] = useState(false);

  const [existingDoctorId, setExistingDoctorId] = useState('');
  const [existingDate, setExistingDate] = useState('');
  const [existingSlot, setExistingSlot] = useState('10:00 AM');
  const [bookingExisting, setBookingExisting] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'rx' | 'lab' | 'bills' | 'book'>('overview');

  const [viewRx, setViewRx] = useState<any | null>(null);
  const [viewLabReport, setViewLabReport] = useState<any | null>(null);

  useEffect(() => {
    fetchDoctors();
    const saved = localStorage.getItem('drbloo_active_patient');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  const field = 'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors px-4 sm:px-6 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold border border-emerald-500 animate-bounce flex items-center gap-1.5">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {portalMode === 'verify' && (
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 sm:p-8 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded uppercase tracking-wider">
                Patient Self-Service Portal
              </span>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Welcome to DrBlooMedi
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                Enter your 10-digit mobile number to access your secure medical dossier or schedule OPD visits.
              </p>
            </div>

            {verifyError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-lg font-semibold flex items-center gap-2">
                <span>⚠️</span> {verifyError}
              </div>
            )}

            <form onSubmit={handleVerifyPhone} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1.5">
                  Mobile Number (10 Digits) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">📱</span>
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    required
                    placeholder="e.g. 9876543210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                {verifying ? 'Verifying Identity...' : 'Verify Mobile Number →'}
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-400 font-mono">
              ⚡ Real-time synchronization with Reception desk queue.
            </p>
          </div>
        </div>
      )}

      {portalMode === 'new_patient_register' && (
        <div className="min-h-[85vh] flex items-center justify-center py-6">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full p-6 sm:p-8 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded uppercase">
                  New Patient Profile
                </span>
                <h1 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mt-1">Quick Registration & Booking</h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Verified Mobile: <span className="font-bold text-emerald-600 dark:text-emerald-400">{phoneInput}</span>
                </p>
              </div>
              <button
                onClick={() => setPortalMode('verify')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {verifyError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-lg font-semibold flex items-center gap-2">
                <span>⚠️</span> {verifyError}
              </div>
            )}

            <form onSubmit={handleRegisterAndBook} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={field}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={field}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className={field}
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400 block tracking-wider">
                  Select Specialist & Slot
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Doctor / Specialist *</label>
                  <select
                    required
                    value={newRegDoctorId}
                    onChange={(e) => setNewRegDoctorId(e.target.value)}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={newRegDate}
                      onChange={(e) => setNewRegDate(e.target.value)}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Time Slot</label>
                    <select
                      value={newRegSlot}
                      onChange={(e) => setNewRegSlot(e.target.value)}
                      className={field}
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer mt-2"
              >
                {registering ? 'Creating Account & Booking...' : 'Complete Registration & Book Slot →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {portalMode === 'dossier' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {bookingSuccessAlert && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg font-semibold flex justify-between items-center shadow-2xs">
              <span>✓ {bookingSuccessAlert}</span>
              <button onClick={() => setBookingSuccessAlert(null)} className="font-bold text-emerald-700 dark:text-emerald-400 hover:text-slate-900 cursor-pointer">✕</button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded uppercase">
                Verified Patient Dossier
              </span>
              <h1 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {history?.profile?.fullName || patient?.fullName}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Phone: <strong className="text-slate-700 dark:text-slate-200">{history?.profile?.phone || patient?.phone}</strong> • Email: {history?.profile?.email || 'N/A'} • Age: {history?.profile?.age || 'N/A'} • Blood Group: {history?.profile?.bloodGroup || 'O+'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadDossier(patient.id)}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Consultations</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{history?.summary?.totalVisits || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">🩺</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prescriptions</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">{history?.summary?.totalPrescriptions || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">💊</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lab Diagnostics</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">{history?.summary?.totalLabTests || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base border border-purple-200 dark:border-purple-900 font-mono font-bold">🔬</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoices</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{history?.summary?.totalBills || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base border border-emerald-200 dark:border-emerald-900 font-mono font-bold">💳</div>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 overflow-x-auto text-xs font-semibold">
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
                className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Latest Consultation & Prescription</h2>
              {history?.prescriptions?.length > 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Diagnosis: {history.prescriptions[0].diagnosis}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Prescribed on {new Date(history.prescriptions[0].createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewRx(history.prescriptions[0])}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer"
                  >
                    Print Prescription
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center font-medium">No prescriptions recorded yet.</p>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Previous & Scheduled Consultations</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {history?.appointments?.length === 0 ? (
                  <p className="py-8 text-center text-slate-500 font-medium">No appointments recorded.</p>
                ) : (
                  history?.appointments?.map((apt: any) => (
                    <div key={apt.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Dr. {apt.doctor?.user?.fullName || apt.doctor?.specialization || 'Doctor'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Date: {new Date(apt.appointmentDate).toLocaleDateString()} • Slot: {apt.timeSlot}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold rounded border border-emerald-200 dark:border-emerald-900">
                        {apt.status || 'SCHEDULED'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'rx' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Prescriptions History</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {history?.prescriptions?.length === 0 ? (
                  <p className="py-8 text-center text-slate-500 font-medium">No prescriptions found.</p>
                ) : (
                  history?.prescriptions?.map((rx: any) => (
                    <div key={rx.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Diagnosis: {rx.diagnosis || 'Routine Evaluation'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Date: {new Date(rx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setViewRx(rx)} className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs">
                        View & Print Rx
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'lab' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Diagnostic & Lab Reports</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {history?.labOrders?.length === 0 ? (
                  <p className="py-8 text-center text-slate-500 font-medium">No lab investigations recorded.</p>
                ) : (
                  history?.labOrders?.map((lab: any) => (
                    <div key={lab.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{lab.labTest?.testName || 'Investigation'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Requested: {new Date(lab.createdAt).toLocaleDateString()}</p>
                      </div>
                      {lab.status === 'COMPLETED' && (
                        <button onClick={() => setViewLabReport(lab)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer">
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
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Billing & Invoices</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {history?.bills?.length === 0 ? (
                  <p className="py-8 text-center text-slate-500 font-medium">No invoices found.</p>
                ) : (
                  history?.bills?.map((bill: any) => (
                    <div key={bill.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{bill.invoiceNumber}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Date: {new Date(bill.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">₹{bill.totalAmount || bill.amount}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'book' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs max-w-xl mx-auto space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Book Follow-up Consultation</h2>
              <form onSubmit={handleExistingBook} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Select Specialist *</label>
                  <select
                    required
                    value={existingDoctorId}
                    onChange={(e) => setExistingDoctorId(e.target.value)}
                    className={field}
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user?.fullName || d.specialization} (Fee: ₹{d.consultationFee || 500})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Preferred Date *</label>
                    <input
                      type="date"
                      required
                      value={existingDate}
                      onChange={(e) => setExistingDate(e.target.value)}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Time Slot *</label>
                    <select
                      value={existingSlot}
                      onChange={(e) => setExistingSlot(e.target.value)}
                      className={field}
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={bookingExisting} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-2xs transition cursor-pointer">
                  {bookingExisting ? 'Scheduling with Reception...' : 'Confirm Appointment for Reception Desk →'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {viewRx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded uppercase">
                  Digital E-Prescription
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">DRBLOOMEDI HEALTHCARE</h2>
              </div>
              <button onClick={() => setViewRx(null)} className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                ✕
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Diagnosis: {viewRx.diagnosis}</p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50">
              {Array.isArray(viewRx.medicines) &&
                viewRx.medicines.map((m: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{m.name || m.medicineName}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">{m.dosage} • {m.duration}</span>
                  </div>
                ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Print Rx
              </button>
              <button
                type="button"
                onClick={() => setViewRx(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewLabReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 rounded uppercase">
                  Verified Lab Report
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">DRBLOOMEDI DIAGNOSTICS</h2>
              </div>
              <button onClick={() => setViewLabReport(null)} className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Test:</span>
                <span>{viewLabReport.labTest?.testName}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                <span>Result:</span>
                <span>{viewLabReport.resultValue} {viewLabReport.labTest?.unit}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Print Report
              </button>
              <button
                type="button"
                onClick={() => setViewLabReport(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
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