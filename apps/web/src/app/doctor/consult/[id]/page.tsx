'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DoctorConsultPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<any>(null);
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);
  const [isOldPatient, setIsOldPatient] = useState(false);

  // Clinical Consultation States
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [consultationFee, setConsultationFee] = useState('500');
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Medicines List
  const [meds, setMeds] = useState([
    {
      medicineName: 'Paracetamol 650mg',
      dosage: '1 Tab',
      frequency: '1-0-1',
      duration: '5 Days',
      instructions: 'After food',
    },
  ]);

  // Lab Tests Suggested with Fallback Default Catalog to prevent empty dropdown
  const defaultLabCatalog = [
    { id: 'test_1', testName: 'Complete Blood Count (CBC)', price: 350 },
    { id: 'test_2', testName: 'Dengue Serology NS1/IgM', price: 600 },
    { id: 'test_3', testName: 'Liver Function Test (LFT)', price: 750 },
    { id: 'test_4', testName: 'Widal Slide Agglutination', price: 250 },
    { id: 'test_5', testName: 'Random Blood Sugar (RBS)', price: 100 },
    { id: 'test_6', testName: 'Serum Electrolytes', price: 450 },
    { id: 'test_7', testName: 'Urine Routine & Microscopic', price: 200 },
  ];

  const [labTests, setLabTests] = useState<{ id?: string; testName: string; testPrice: number }[]>([]);
  const [availableTestsCatalog, setAvailableTestsCatalog] = useState<any[]>(defaultLabCatalog);
  const [selectedLabTestId, setSelectedLabTestId] = useState('');

  useEffect(() => {
    if (appointmentId) {
      fetchPatientConsultData();
      fetchLabCatalog();
    }
  }, [appointmentId]);

  const fetchLabCatalog = async () => {
    try {
      const res = await fetch('https://drbloomedi-backend.onrender.com/lab/tests');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Map backend format to UI format
          const formatted = data.map((t: any) => ({
            id: t.id,
            testName: t.testName || t.name,
            price: Number(t.price || 350),
          }));
          setAvailableTestsCatalog(formatted);
        }
      }
    } catch (e) {
      console.warn('Using default lab catalog fallback due to network/server response:', e);
    }
  };

  const fetchPatientConsultData = async () => {
    try {
      setLoading(true);

      let aptData: any = null;
      const directAptRes = await fetch(`https://drbloomedi-backend.onrender.com/appointments/${appointmentId}`).catch(() => null);
      
      if (directAptRes && directAptRes.ok) {
        aptData = await directAptRes.json();
      } else {
        const listRes = await fetch('https://drbloomedi-backend.onrender.com/appointments').catch(() => null);
        if (listRes && listRes.ok) {
          const list = await listRes.json();
          aptData = Array.isArray(list) ? list.find((a: any) => String(a.id) === String(appointmentId)) : null;
        }
      }

      if (aptData) {
        setCurrentAppointment(aptData);
        if (aptData.symptoms) {
          setClinicalNotes(`Complaints: ${aptData.symptoms}`);
        }

        const pat = aptData.patient;
        if (pat?.id) {
          const emrRes = await fetch(`https://drbloomedi-backend.onrender.com/emr/patient/${pat.id}`).catch(() => null);
          if (emrRes && emrRes.ok) {
            const emrData = await emrRes.json();
            const loadedPatient = emrData.patient || emrData;
            setPatientData({
              ...pat,
              ...loadedPatient,
              prescriptions: emrData.prescriptions || loadedPatient.prescriptions || [],
              labOrders: emrData.labOrders || loadedPatient.labOrders || [],
            });
            const prevConsults = (emrData.prescriptions || loadedPatient.prescriptions || []).length;
            setIsOldPatient(prevConsults > 0);
          } else {
            setPatientData(pat);
          }
        }
      }
    } catch (err) {
      console.error('Error loading patient consult data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation not supported on this browser. Please use Google Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setClinicalNotes((prev) => (prev ? `${prev} ${text}` : text));
    };
    recognition.start();
  };

  const addMedRow = () => {
    setMeds([
      ...meds,
      {
        medicineName: '',
        dosage: '1 Tab',
        frequency: '1-0-1',
        duration: '3 Days',
        instructions: 'After meals',
      },
    ]);
  };

  const removeMedRow = (index: number) => {
    setMeds(meds.filter((_, idx) => idx !== index));
  };

  const addLabTest = () => {
    if (!selectedLabTestId) return;
    const testObj = availableTestsCatalog.find((t) => String(t.id) === String(selectedLabTestId));
    if (testObj) {
      if (!labTests.some((t) => t.testName === testObj.testName)) {
        setLabTests([...labTests, { id: testObj.id, testName: testObj.testName, testPrice: testObj.price }]);
      }
    }
    setSelectedLabTestId('');
  };

  const removeLabTest = (index: number) => {
    setLabTests(labTests.filter((_, idx) => idx !== index));
  };

  // Save Consultation & Transmit Lab Tests via Backend Endpoint & Billing
  const handleSaveAndPrint = async () => {
    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis');
      return;
    }

    const targetPatientId = patientData?.id || currentAppointment?.patient?.id;
    if (!targetPatientId) {
      alert('Patient data not loaded yet. Please refresh the page.');
      return;
    }

    const doctorId = currentAppointment?.doctor?.id || patientData?.doctor?.id || 1;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      setIsSaving(true);

      const validMedicines = meds
        .filter((m) => m.medicineName && m.medicineName.trim() !== '')
        .map((m) => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim() || '1 Tab',
          frequency: m.frequency.trim() || '1-0-1',
          duration: m.duration.trim() || '5 Days',
          instructions: m.instructions || 'After meals',
        }));

      // Prescription Payload
      const payload = {
        patientId: targetPatientId,
        doctorId: Number(doctorId),
        appointmentId: appointmentId || undefined,
        diagnosis: diagnosis.trim(),
        symptoms: currentAppointment?.symptoms || '',
        advice: clinicalNotes.trim() + (nextVisitDate ? `\nFollow-up: ${nextVisitDate}` : ''),
        medicines: validMedicines,
        labTests: labTests.map((t) => t.testName),
      };

      // 1. Save Prescription to Backend
      await fetch('https://drbloomedi-backend.onrender.com/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // 2. Save Pathology Lab Orders using the Unified /lab/consultation-orders Endpoint
      if (labTests.length > 0 && appointmentId) {
        try {
          // Filter real backend IDs if available, else send names/fallback
          const testIds = labTests.map((t) => t.id).filter(id => id && !String(id).startsWith('test_'));
          
          await fetch('https://drbloomedi-backend.onrender.com/lab/consultation-orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              appointmentId: appointmentId,
              patientId: targetPatientId,
              labTestIds: testIds.length > 0 ? testIds : labTests.map(t => t.testName),
            }),
          });
        } catch (e) {
          console.error('Failed to sync consultation lab orders:', e);
        }

        // Live Counter Storage Fallback for instant Reception Desk Billing
        try {
          localStorage.setItem(
            `drbloomedi_lab_orders_${appointmentId}`,
            JSON.stringify(labTests)
          );
        } catch (_) {}
      }

      // 3. Mark Appointment Status as COMPLETED
      if (appointmentId) {
        try {
          await fetch(`https://drbloomedi-backend.onrender.com/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ status: 'Completed' }),
          });
        } catch (_) {}
      }

      alert('Prescription and Lab Tests saved successfully! Transmitting to Lab Portal & Billing Desk.');
      window.print();
      router.push('/reception/dashboard');
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err.message || 'Error completing consultation');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 font-bold text-slate-400 text-xs text-center font-mono">
        Loading patient clinical chart...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans space-y-6 max-w-7xl mx-auto">
      <style>{`
        @media print {
          aside, header, nav, button, a, select {
            display: none !important;
          }
          body {
            background: white !important;
          }
          @page {
            size: A4;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">
              {patientData?.fullName || currentAppointment?.patient?.fullName || 'Patient Consultation'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isOldPatient ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isOldPatient ? 'Old Patient' : 'New Patient'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Phone: <strong className="text-slate-800">{patientData?.phone || currentAppointment?.patient?.phone || 'N/A'}</strong> • Age:{' '}
            <strong className="text-slate-800">{patientData?.age || 'N/A'} Yrs</strong> • Slot:{' '}
            <strong className="text-blue-700">{currentAppointment?.timeSlot || 'Scheduled'}</strong>
          </p>
        </div>

        <div className="flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            🖨️ Print
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndPrint}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : '💾 Save & Print Prescription'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Clinical Assessment
            </h2>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Diagnosis *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Viral Pharyngitis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:border-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Clinical Advice & Notes
                </label>
                <button
                  type="button"
                  onClick={startVoiceDictation}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 print:hidden ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>🎤</span>
                  <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Dietary instructions, rest, precautions..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* Rx Medicines */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Prescribed Medicines (Rx)
              </h2>
              <button
                type="button"
                onClick={addMedRow}
                className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition print:hidden"
              >
                + Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {meds.map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 items-center"
                >
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                    value={m.medicineName}
                    onChange={(e) => {
                      const updated = [...meds];
                      updated[idx].medicineName = e.target.value;
                      setMeds(updated);
                    }}
                    className="p-2 text-xs border border-slate-200 rounded-xl font-bold md:col-span-5 outline-none bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={m.dosage}
                    onChange={(e) => {
                      const updated = [...meds];
                      updated[idx].dosage = e.target.value;
                      setMeds(updated);
                    }}
                    className="p-2 text-xs border border-slate-200 rounded-xl md:col-span-2 outline-none bg-white"
                  />
                  <select
                    value={m.frequency}
                    onChange={(e) => {
                      const updated = [...meds];
                      updated[idx].frequency = e.target.value;
                      setMeds(updated);
                    }}
                    className="p-2 text-xs border border-slate-200 rounded-xl md:col-span-2 outline-none bg-white font-semibold"
                  >
                    <option value="1-0-1">1-0-1 (BD)</option>
                    <option value="1-1-1">1-1-1 (TDS)</option>
                    <option value="1-0-0">1-0-0 (OD)</option>
                    <option value="0-0-1">0-0-1 (Night)</option>
                    <option value="SOS">SOS</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Duration"
                    value={m.duration}
                    onChange={(e) => {
                      const updated = [...meds];
                      updated[idx].duration = e.target.value;
                      setMeds(updated);
                    }}
                    className="p-2 text-xs border border-slate-200 rounded-xl md:col-span-2 outline-none bg-white"
                  />
                  {meds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedRow(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl text-center md:col-span-1 print:hidden font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Lab Tests Catalog Selection with Fallback Support */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Suggest Pathology Tests
            </h2>
            <div className="flex gap-2 print:hidden">
              <select
                value={selectedLabTestId}
                onChange={(e) => setSelectedLabTestId(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl font-bold bg-slate-50 outline-none"
              >
                <option value="">-- Select Investigation --</option>
                {availableTestsCatalog.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.testName} - ₹{test.price}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addLabTest}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
              >
                Add
              </button>
            </div>

            {labTests.length > 0 && (
              <div className="space-y-2 mt-2">
                {labTests.map((t, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2.5 bg-purple-50 rounded-xl text-xs font-bold text-purple-900 border border-purple-100"
                  >
                    <span>🔬 {t.testName}</span>
                    <div className="flex items-center gap-2">
                      <span>₹{t.testPrice}</span>
                      <button
                        type="button"
                        onClick={() => removeLabTest(i)}
                        className="text-rose-500 hover:text-rose-700 print:hidden"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Previous History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Previous Consultations
            </h2>
            {isOldPatient && patientData?.prescriptions?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                {patientData.prescriptions.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1"
                  >
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{p.diagnosis}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{p.advice || '-'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                First clinical consultation recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}