'use client';

import React, { useState, useEffect } from 'react';

interface Doctor {
  id: number;
  specialization: string;
  user?: { email: string };
}

export default function PatientPortalPage() {
  // Navigation Steps:
  // PHONE_ENTRY -> (Existing Patient? TOKEN_VERIFY : REGISTER_NEW directly without token) -> DASHBOARD
  const [step, setStep] = useState<'PHONE_ENTRY' | 'TOKEN_VERIFY' | 'REGISTER_NEW' | 'DASHBOARD'>('PHONE_ENTRY');

  const [phone, setPhone] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // New Patient Registration Fields (Matched strictly with backend Patient entity)
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  // Loaded Patient Dossier
  const [patient, setPatient] = useState<any>(null);

  // Appointment Modal States
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [reason, setReason] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'labs' | 'bills'>('appointments');

  // 1. Fetch Doctors List
  useEffect(() => {
    fetch('http://localhost:4000/doctors')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDoctors(data);
      })
      .catch((err) => console.error('Failed to load doctors', err));
  }, []);

  // 2. Phone Check Flow
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch('http://localhost:4000/patients');
      const allPatients = await res.json();
      const existing = allPatients.find((p: any) => p.phone === cleanPhone);

      if (existing) {
        // Existing Patient: Require security token verification
        const mockToken = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedToken(mockToken);
        setPatient(existing);
        setStep('TOKEN_VERIFY');
      } else {
        // New Patient: Directly navigate to registration (No token required)
        setPatient(null);
        setFullName('');
        setAge('');
        setStep('REGISTER_NEW');
      }
    } catch (err: any) {
      setErrorMsg('Unable to connect to the backend server. Please ensure port 4000 is running.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Existing Patient Token Verification
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (tokenInput.trim() !== generatedToken) {
      setErrorMsg('Invalid verification token. Please verify and re-enter.');
      return;
    }

    if (patient) {
      await loadFullHistory(patient.id);
      setStep('DASHBOARD');
    }
  };

  // 4. Load Full Patient Dossier & Smart-Match Appointments
  const loadFullHistory = async (patientId: string) => {
    try {
      setLoading(true);

      // 1. Fetch EMR Dossier (prescriptions, labs, bills)
      const historyRes = await fetch(`http://localhost:4000/emr/patient/${patientId}`);
      let currentPatient: any = null;
      if (historyRes.ok) {
        const histData = await historyRes.json();
        currentPatient = histData.patient || histData;
      }

      if (!currentPatient) {
        currentPatient = patient || { id: patientId };
      }

      // 2. Fetch All Appointments & Strict/Loose Matching
      const aptRes = await fetch('http://localhost:4000/appointments');
      if (aptRes.ok) {
        const allApts = await aptRes.json();
        const currentTargetId = String(patientId);
        const currentTargetPhone = currentPatient?.phone ? String(currentPatient.phone).trim() : '';

        const myApts = Array.isArray(allApts)
          ? allApts.filter((a: any) => {
              const directPatId = a.patientId ? String(a.patientId) : '';
              const nestedPatId = a.patient?.id ? String(a.patient.id) : '';
              const nestedPatPhone = a.patient?.phone ? String(a.patient.phone).trim() : '';

              return (
                directPatId === currentTargetId ||
                nestedPatId === currentTargetId ||
                (currentTargetPhone && nestedPatPhone === currentTargetPhone)
              );
            })
          : [];

        currentPatient = {
          ...currentPatient,
          appointments: myApts,
        };
      }

      setPatient(currentPatient);
    } catch (err) {
      console.error('Error fetching patient records', err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Direct Registration for New Patient
  const handleRegisterNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      // Strictly matches backend entity fields
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        gender: gender || 'Male',
        age: Number(age) || 25,
      };

      const res = await fetch('http://localhost:4000/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detailedMessage = Array.isArray(responseData.message)
          ? responseData.message.join(', ')
          : responseData.message || `Server error with status code ${res.status}`;
        throw new Error(detailedMessage);
      }

      setPatient({
        ...responseData,
        appointments: [],
        prescriptions: [],
        labOrders: [],
        billings: [],
      });
      setStep('DASHBOARD');
    } catch (err: any) {
      console.error('Registration failure:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Book Appointment & Instantly Push to UI
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient?.id) return;

    try {
      setSubmittingBooking(true);
      const res = await fetch('http://localhost:4000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: Number(selectedDoctorId),
          appointmentDate,
          timeSlot,
          reason: reason || 'General OPD Visit',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Could not schedule appointment slot.');
      }

      const newBooking = await res.json();

      // Find chosen doctor for local preview display
      const chosenDoc = doctors.find((d) => d.id === Number(selectedDoctorId));
      const formattedBooking = {
        ...newBooking,
        doctor: newBooking.doctor || chosenDoc,
      };

      // UI par turant count aur list update karein
      setPatient((prev: any) => {
        const prevAppointments = Array.isArray(prev?.appointments) ? prev.appointments : [];
        return {
          ...prev,
          appointments: [formattedBooking, ...prevAppointments],
        };
      });

      alert('Appointment booked successfully! Your visit is now listed below.');
      setIsBookingOpen(false);
      setActiveTab('appointments');

      // Sync fresh data from backend
      await loadFullHistory(patient.id);
    } catch (err: any) {
      alert(err.message || 'Appointment booking failed');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const appointmentList = Array.isArray(patient?.appointments) ? patient.appointments : [];
  const prescriptionList = Array.isArray(patient?.prescriptions) ? patient.prescriptions : [];
  const labList = Array.isArray(patient?.labOrders) ? patient.labOrders : [];
  const billingList = Array.isArray(patient?.billings) ? patient.billings : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">
            DrBloo<span className="text-slate-900">Medi</span> Patient Portal
          </h1>
          <p className="text-xs text-slate-500">Quick OPD Booking • Instant Dossier Access • Direct Lab Downloads</p>
        </div>
        {step === 'DASHBOARD' && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsBookingOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <span>📅</span>
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => {
                setStep('PHONE_ENTRY');
                setPatient(null);
                setTokenInput('');
                setPhone('');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* STEP 1: Phone Entry Screen */}
      {step === 'PHONE_ENTRY' && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Patient Access & Registration</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter your 10-digit mobile number to proceed</p>
          </div>

          <form onSubmit={handleCheckPhone} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mobile Number</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 text-sm border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:border-blue-600"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-600 font-bold">⚠️ {errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md transition"
            >
              {loading ? 'Checking records...' : 'Continue →'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Token Verification (Existing Patients Only) */}
      {step === 'TOKEN_VERIFY' && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Existing Patient Record Found
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-2">Security Verification</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the access token code for mobile <strong>{phone}</strong>:
            </p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
            <span className="font-bold">Generated Token Code:</span> <code className="font-mono font-black text-base ml-1">{generatedToken}</code>
          </div>

          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">6-Digit Access Token</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full p-3 text-center text-lg font-mono font-black tracking-widest border border-slate-200 rounded-2xl outline-none focus:border-blue-600"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-600 font-bold">⚠️ {errorMsg}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('PHONE_ENTRY')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md transition"
              >
                Unlock History →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Direct Registration for New Patients (No Token Required) */}
      {step === 'REGISTER_NEW' && (
        <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              New Patient Registration
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">First Time Visiting?</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Register your file for mobile <strong>{phone}</strong> (no token verification required)
            </p>
          </div>

          <form onSubmit={handleRegisterNewPatient} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Age *</label>
                <input
                  type="number"
                  required
                  placeholder="Yrs"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {errorMsg && <p className="text-xs text-rose-600 font-bold">⚠️ {errorMsg}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('PHONE_ENTRY')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
              >
                Change Phone
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md transition"
              >
                {loading ? 'Creating File...' : '✓ Register & Open Portal →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: Authenticated Dashboard */}
      {step === 'DASHBOARD' && patient && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-md flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Verified Patient File
                </span>
                <span className="text-[10px] uppercase font-mono bg-blue-900/50 px-2 py-0.5 rounded-full">
                  ID: {patient.id}
                </span>
              </div>
              <h2 className="text-2xl font-black mt-1">{patient.fullName}</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Phone: <strong>{patient.phone}</strong> • Age: <strong>{patient.age || 'N/A'} Yrs</strong> • Gender: <strong>{patient.gender || 'N/A'}</strong>
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Print Medical File</span>
            </button>
          </div>

          {/* Navigation Tabs with Dynamic Counts */}
          <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'appointments' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              📅 Appointments ({appointmentList.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'prescriptions' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              💊 Prescriptions ({prescriptionList.length})
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'labs' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              🔬 Diagnostic Reports ({labList.length})
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'bills' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              💳 Billing Invoices ({billingList.length})
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[300px]">
            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-3">
                {appointmentList.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-slate-400">No appointments scheduled yet.</p>
                    <button
                      onClick={() => setIsBookingOpen(true)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl"
                    >
                      Book First Consultation Now
                    </button>
                  </div>
                ) : (
                  appointmentList.map((apt: any, idx: number) => {
                    const docSpecialty = apt.doctor?.specialization || 'General OPD';
                    const docName = apt.doctor?.user?.email?.split('@')[0] || `ID #${apt.doctorId || ''}`;

                    return (
                      <div key={apt.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">
                            Dr. {docName} ({docSpecialty})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Date: <strong className="text-slate-800">{apt.appointmentDate}</strong> at <strong className="text-slate-800">{apt.timeSlot}</strong>
                          </p>
                          {apt.reason && <p className="text-[11px] text-slate-400 italic">Reason: {apt.reason}</p>}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {apt.status || 'SCHEDULED'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-3">
                {prescriptionList.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">No prescriptions issued yet.</p>
                ) : (
                  prescriptionList.map((rx: any) => (
                    <div key={rx.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900">Dr. {rx.doctor?.user?.email?.split('@')[0] || 'Doctor'}</p>
                          <p className="text-[11px] text-slate-500">Diagnosis: <strong className="text-slate-800">{rx.diagnosis}</strong></p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {rx.advice && <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 text-[11px]">Advice: {rx.advice}</p>}
                      {rx.medicines && rx.medicines.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="font-bold text-[10px] text-slate-500 uppercase mb-1">Prescribed Medicines:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {rx.medicines.map((m: any, idx: number) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold border border-blue-100">
                                {m.medicineName} ({m.frequency || m.dosage})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Diagnostic Reports Tab */}
            {activeTab === 'labs' && (
              <div className="space-y-3">
                {labList.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">No lab orders found on file.</p>
                ) : (
                  labList.map((lab: any) => (
                    <div key={lab.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{lab.labTest?.testName || 'Diagnostic Test'}</p>
                        <p className="text-[11px] text-slate-500 font-mono">Order Token: #{lab.orderNumber}</p>
                        {lab.resultValue && (
                          <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                            Observed Value: {lab.resultValue} {lab.labTest?.unit || ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          lab.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {lab.status}
                        </span>

                        {lab.reportFileUrl ? (
                          <a
                            href={lab.reportFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          >
                            <span>📥</span>
                            <span>Download / View Report</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No File Attached</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bills Tab */}
            {activeTab === 'bills' && (
              <div className="space-y-3">
                {billingList.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">No billing invoices found.</p>
                ) : (
                  billingList.map((bill: any) => (
                    <div key={bill.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-bold text-blue-600">{bill.invoiceNumber || `INV-${bill.id}`}</p>
                        <p className="text-[11px] text-slate-500">Payment: {bill.paymentMethod || 'Cash'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900">₹{Number(bill.totalAmount || bill.amount || 0).toFixed(2)}</span>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                          🖨️ Print Receipt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Schedule Doctor Appointment</h3>
              <button onClick={() => setIsBookingOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
            </div>

            <form onSubmit={handleBookAppointment} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Select Doctor *</label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.email?.split('@')[0]} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date *</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Time Slot *</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Symptoms / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Fever, headache, routine checkup"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {submittingBooking ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}