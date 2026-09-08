'use client';

import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://drbloomedi-backend.onrender.com';

export default function PatientPortalPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

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
  const [address, setAddress] = useState('');
  const [newRegDoctorId, setNewRegDoctorId] = useState('');
  const [newRegDate, setNewRegDate] = useState('');
  const [newRegSlot, setNewRegSlot] = useState('10:00 AM');
  const [registering, setRegistering] = useState(false);

  // Existing Patient Booking Form State
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
    if (!phoneInput.trim()) return;

    try {
      setVerifying(true);
      setVerifyError('');
      setBookingSuccessAlert(null);

      const res = await fetch(`${BACKEND_URL}/patient-portal/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput.trim() }),
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

  const handleRegisterAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneInput || !newRegDoctorId || !newRegDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setRegistering(true);
      const res = await fetch(`${BACKEND_URL}/patient-portal/auth/register-and-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email.trim() || `${phoneInput.trim()}@patient.drbloomedi.com`,
          phone: phoneInput.trim(),
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
      setBookingSuccessAlert(
        'Appointment Booked Successfully! Reception desk has received your scheduled token.'
      );
      setPortalMode('dossier');
      loadDossier(data.patient.id);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  const handleExistingBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !existingDoctorId || !existingDate) {
      alert('Please select a doctor and date');
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

      setBookingSuccessAlert(
        'New Appointment Scheduled! Reception Desk counter has been updated.'
      );
      setExistingDoctorId('');
      setExistingDate('');
      setActiveTab('appointments');
      loadDossier(patient.id);
    } catch (err: any) {
      alert(`Booking Error: ${err.message}`);
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
  };

  // 1. PHONE VERIFY SCREEN
  if (portalMode === 'verify') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black px-2.5 py-1 bg-sky-100 text-sky-800 rounded-full uppercase tracking-wider">
              Module 4 • Patient Portal
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Patient Portal Access
            </h1>
            <p className="text-xs text-slate-500">
              Verify your mobile number to view medical records or book a consultation.
            </p>
          </div>

          {verifyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold">
              ⚠️ {verifyError}
            </div>
          )}

          <form onSubmit={handleVerifyPhone} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Enter Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs shadow-md transition"
            >
              {verifying ? 'Verifying Identity...' : 'Verify Phone Number →'}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400">
            Existing patients will be redirected to their full history. New patients will get instant registration.
          </p>
        </div>
      </div>
    );
  }

  // 2. NEW PATIENT REGISTRATION FORM
  if (portalMode === 'new_patient_register') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-lg w-full p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full uppercase">
                New Patient Detected
              </span>
              <h1 className="text-xl font-black text-slate-900 mt-1">Quick Registration & Booking</h1>
              <p className="text-xs text-slate-500">
                Registering for mobile number: <span className="font-bold text-slate-800">{phoneInput}</span>
              </p>
            </div>
            <button
              onClick={() => setPortalMode('verify')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleRegisterAndBook} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Age</label>
                <input
                  type="number"
                  placeholder="28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Select Doctor & Slot (Transmitted to Reception Desk)
              </span>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Doctor / Specialist *
                </label>
                <select
                  required
                  value={newRegDoctorId}
                  onChange={(e) => setNewRegDoctorId(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newRegDate}
                    onChange={(e) => setNewRegDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time Slot</label>
                  <select
                    value={newRegSlot}
                    onChange={(e) => setNewRegSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
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
              className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-md transition mt-2"
            >
              {registering ? 'Creating Account & Booking...' : 'Complete Registration & Book Slot →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. VERIFIED PATIENT 360° DOSSIER
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans max-w-7xl mx-auto space-y-6">
      {bookingSuccessAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex justify-between items-center">
          <span>✓ {bookingSuccessAlert}</span>
          <button onClick={() => setBookingSuccessAlert(null)} className="text-emerald-900 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase">
            Verified Patient Dossier
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {history?.profile?.fullName || patient?.fullName}
          </h1>
          <p className="text-xs text-slate-500">
            Phone: <span className="font-bold text-slate-800">{history?.profile?.phone || patient?.phone}</span> • Email: {history?.profile?.email || 'N/A'} • Age: {history?.profile?.age || 'N/A'} • Blood Group: {history?.profile?.bloodGroup || 'O+'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDossier(patient.id)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
          >
            🔄 Refresh History
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Consultations</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{history?.summary?.totalVisits || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Prescriptions</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{history?.summary?.totalPrescriptions || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Lab Diagnostics</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{history?.summary?.totalLabTests || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Invoices</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{history?.summary?.totalBills || 0}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
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
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
              activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TIMELINE TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase">Latest Consultation & Prescription</h2>
            {history?.prescriptions?.length > 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Diagnosis: {history.prescriptions[0].diagnosis}</p>
                  <p className="text-[10px] text-slate-400">
                    Prescribed by Dr. {history.prescriptions[0].doctor?.specialization || 'Physician'} on{' '}
                    {new Date(history.prescriptions[0].createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setViewRx(history.prescriptions[0])}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-[11px]"
                >
                  Print Prescription
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">No prescriptions recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* 2. APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase">Previous & Scheduled Consultations</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {history?.appointments?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No appointments recorded.</p>
            ) : (
              history?.appointments?.map((apt: any) => (
                <div key={apt.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">
                      Dr. {apt.doctor?.user?.fullName || apt.doctor?.specialization || 'Doctor'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Date: {new Date(apt.appointmentDate).toLocaleDateString()} • Slot: {apt.timeSlot || '10:00 AM'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                    {apt.status || 'SCHEDULED'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. PRESCRIPTIONS TAB */}
      {activeTab === 'rx' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase">Prescriptions History</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {history?.prescriptions?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No prescriptions found.</p>
            ) : (
              history?.prescriptions?.map((rx: any) => (
                <div key={rx.id} className="py-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Diagnosis: {rx.diagnosis || 'Routine Evaluation'}</p>
                    <p className="text-[10px] text-slate-400">
                      Date: {new Date(rx.createdAt).toLocaleDateString()} • Dr. {rx.doctor?.specialization || 'Doctor'}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewRx(rx)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-xl shadow-sm"
                  >
                    View & Print Rx
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. LAB REPORTS TAB */}
      {activeTab === 'lab' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase">Diagnostic & Lab Reports</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {history?.labOrders?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No lab investigations recorded.</p>
            ) : (
              history?.labOrders?.map((lab: any) => (
                <div key={lab.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{lab.labTest?.testName || 'Investigation'}</p>
                    <p className="text-[10px] text-slate-400">
                      Requested: {new Date(lab.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        lab.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {lab.status}
                    </span>
                    {lab.status === 'COMPLETED' && (
                      <button
                        onClick={() => setViewLabReport(lab)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl shadow-sm"
                      >
                        Download Report
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. INVOICES TAB */}
      {activeTab === 'bills' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase">Billing & Invoices</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {history?.bills?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No invoices found.</p>
            ) : (
              history?.bills?.map((bill: any) => (
                <div key={bill.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{bill.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-400">
                      Date: {new Date(bill.createdAt).toLocaleDateString()} • Method: {bill.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-700 text-sm">₹{bill.totalAmount || bill.amount}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {bill.paymentStatus || 'PAID'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. BOOK NEW APPOINTMENT TAB */}
      {activeTab === 'book' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase">Book Follow-up Consultation</h2>
          <p className="text-xs text-slate-500">
            Booking from this screen directly updates the live queue on the Reception Desk.
          </p>

          <form onSubmit={handleExistingBook} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Select Specialist *
              </label>
              <select
                required
                value={existingDoctorId}
                onChange={(e) => setExistingDoctorId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  value={existingDate}
                  onChange={(e) => setExistingDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Time Slot *
                </label>
                <select
                  value={existingSlot}
                  onChange={(e) => setExistingSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={bookingExisting}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition"
            >
              {bookingExisting ? 'Scheduling with Reception...' : 'Confirm Appointment for Reception Desk →'}
            </button>
          </form>
        </div>
      )}

      {/* PRINT MODALS */}
      {viewRx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full uppercase">
                  Digital E-Prescription
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">DRBLOOMEDI HEALTHCARE</h2>
              </div>
              <button onClick={() => setViewRx(null)} className="w-7 h-7 bg-slate-100 rounded-full font-bold text-slate-500">
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
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Print Rx
              </button>
              <button
                type="button"
                onClick={() => setViewRx(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewLabReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="border-b-2 border-purple-900 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full uppercase">
                  Verified Lab Report
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">DRBLOOMEDI DIAGNOSTICS</h2>
              </div>
              <button onClick={() => setViewLabReport(null)} className="w-7 h-7 bg-slate-100 rounded-full font-bold text-slate-500">
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
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
              >
                Print Report
              </button>
              <button
                type="button"
                onClick={() => setViewLabReport(null)}
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