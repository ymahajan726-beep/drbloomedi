'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API_BASE = 'https://drbloomedi-backend.onrender.com';

type LabTest = { id: string; testName: string; testPrice: number; };
type Medicine = { medicineName: string; dosage: string; frequency: string; duration: string; instructions: string; };

export default function DoctorConsultPage() {
  const { showToast } = useToast();
  const params = useParams();
  const appointmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [oldPatient, setOldPatient] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([{ medicineName: '', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' }]);

  const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    loadAppointment();
    loadLabTests();
  }, [appointmentId]);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = () => {
    const token = getToken();
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const loadAppointment = async () => {
    try {
      setLoading(true);
      let data: any = null;
      const res = await fetch(`${API_BASE}/appointments/${appointmentId}`, { headers: authHeaders(), cache: 'no-store' });
      if (res.ok) {
        data = await res.json();
      } else {
        const listRes = await fetch(`${API_BASE}/appointments`, { headers: authHeaders(), cache: 'no-store' });
        if (listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list)) data = list.find((i: any) => String(i.id) === String(appointmentId));
        }
      }
      if (!data) throw new Error('Appointment not found.');
      setAppointment(data);

      const patientData = data.patient;
      if (!patientData?.id) { setPatient(patientData); return; }

      const emrRes = await fetch(`${API_BASE}/emr/patient/${patientData.id}`, { headers: authHeaders(), cache: 'no-store' });
      if (emrRes.ok) {
        const emr = await emrRes.json();
        const loadedPatient = emr.patient || emr;
        const prescriptions = emr.prescriptions || loadedPatient.prescriptions || [];
        setPatient({ ...patientData, ...loadedPatient, prescriptions, labOrders: emr.labOrders || [] });
        setOldPatient(prescriptions.length > 0);
      } else { setPatient(patientData); }

      if (data.symptoms) setClinicalNotes(`Complaints: ${data.symptoms}`);
    } catch (error: any) {
      showToast(error?.message || 'Unable to load appointment.', 'error');
    } finally { setLoading(false); }
  };

  const loadLabTests = async () => {
    try {
      setLoadingTests(true);
      const res = await fetch(`${API_BASE}/lab/tests`, { headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load laboratory tests.');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid test response.');
      setAvailableTests(data.filter((t: any) => t?.id).map((t: any) => ({
        id: String(t.id),
        testName: String(t.testName || t.name || 'Unnamed Test'),
        testPrice: Number(t.price ?? t.testPrice ?? 0),
      })));
    } catch { setAvailableTests([]); }
    finally { setLoadingTests(false); }
  };

  const addLabTest = () => {
    if (!selectedTestId) return;
    const test = availableTests.find(i => String(i.id) === String(selectedTestId));
    if (!test) { showToast('Test not found.', 'error'); return; }
    if (selectedTests.some(i => String(i.id) === String(test.id))) { showToast('Test already selected.', 'error'); return; }
    setSelectedTests(prev => [...prev, test]);
    setSelectedTestId('');
  };

  const removeLabTest = (idx: number) => setSelectedTests(prev => prev.filter((_, i) => i !== idx));

  const updateMedicine = (idx: number, field: keyof Medicine, value: string) => {
    setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const addMedicine = () => setMedicines(prev => [...prev, { medicineName: '', dosage: '1 Tab', frequency: '1-0-1', duration: '3 Days', instructions: 'After food' }]);
  const removeMedicine = (idx: number) => setMedicines(prev => prev.filter((_, i) => i !== idx));

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast('Voice dictation not supported.', 'error'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      if (text) setClinicalNotes(prev => prev ? `${prev} ${text}` : text);
    };
    recognition.start();
  };

  const saveConsultation = async () => {
    if (!diagnosis.trim()) { showToast('Please enter a diagnosis.', 'error'); return; }
    const patientId = patient?.id || appointment?.patient?.id;
    if (!patientId) { showToast('Patient info missing.', 'error'); return; }

    try {
      setSaving(true);
      const validMedicines = medicines.filter(m => m.medicineName.trim()).map(m => ({
        name: m.medicineName.trim(), dosage: m.dosage.trim() || '1 Tab', freq: m.frequency.trim() || '1-0-1', duration: m.duration.trim() || '5 Days', notes: m.instructions.trim() || 'After food'
      }));

      // 1. Save Prescription
      const presRes = await fetch(`${API_BASE}/prescriptions`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          patientId, doctorId: appointment?.doctor?.id || appointment?.doctorId, appointmentId,
          diagnosis: diagnosis.trim(), symptoms: appointment?.symptoms || '',
          advice: clinicalNotes.trim() + (followUpDate ? `\nFollow-up: ${followUpDate}` : ''),
          medicines: validMedicines, labTests: selectedTests.map(t => t.testName),
        }),
      });
      if (!presRes.ok) throw new Error('Failed to save prescription.');

      // 2. Create Lab Orders if selected
      if (selectedTests.length > 0) {
        const labRes = await fetch(`${API_BASE}/lab/consultation-orders`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ appointmentId, patientId, labTestIds: selectedTests.map(t => String(t.id)) }),
        });
        if (!labRes.ok) throw new Error('Failed to transmit lab orders.');
      }

      // 3. Complete Appointment (Updates status to Completed so it clears doctor queue & routes to reception/pathology)
      if (appointmentId) {
        await fetch(`${API_BASE}/appointments/${appointmentId}/status`, {
          method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: 'Completed' }),
        });
      }

      showToast(selectedTests.length > 0 ? 'Saved! Transmitted to Reception & Pathology.' : 'Saved! Transmitted to Reception billing queue.', 'success');
      window.print();
    } catch (err: any) {
      showToast(err?.message || 'Unable to complete consultation.', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-semibold">Loading patient clinical chart...</div>;

  const patientName = patient?.fullName || appointment?.patient?.fullName || 'Patient Consultation';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <style>{`@media print { button, select, nav, header { display: none !important; } body { background: white !important; } @page { size: A4; margin: 12mm 15mm; } }`}</style>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{patientName}</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${oldPatient ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {oldPatient ? 'OLD PATIENT' : 'NEW PATIENT'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Phone: <b>{patient?.phone || appointment?.patient?.phone || 'N/A'}</b> • Age: <b>{patient?.age || 'N/A'} Yrs</b> • Slot: <b className="text-blue-600">{appointment?.timeSlot || 'Scheduled'}</b></p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">🖨️ Print</button>
          <button disabled={saving} onClick={saveConsultation} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer">
            {saving ? 'Saving...' : '💾 Save & Complete Consultation'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase">Clinical Assessment</h2>
            <div>
              <label className="block mb-1 text-xs font-bold uppercase text-slate-600">Diagnosis *</label>
              <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-600" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-slate-600">Clinical Advice & Notes</label>
                <button type="button" onClick={startVoiceDictation} className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${listening ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  🎤 {listening ? 'Listening...' : 'Voice Dictate'}
                </button>
              </div>
              <textarea rows={4} value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} placeholder="Clinical notes, advice..." className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold uppercase text-slate-600">Next Follow-up</label>
              <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-600" />
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-900 uppercase">Prescribed Medicines</h2>
              <button onClick={addMedicine} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold cursor-pointer">+ Add Medicine</button>
            </div>
            {medicines.map((medicine, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl">
                <input placeholder="Medicine name" value={medicine.medicineName} onChange={e => updateMedicine(index, 'medicineName', e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none" />
                <input placeholder="Dosage" value={medicine.dosage} onChange={e => updateMedicine(index, 'dosage', e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none" />
                <select value={medicine.frequency} onChange={e => updateMedicine(index, 'frequency', e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none">
                  <option value="1-0-1">1-0-1</option><option value="1-1-1">1-1-1</option><option value="1-0-0">1-0-0</option><option value="0-0-1">0-0-1</option><option value="SOS">SOS</option>
                </select>
                <div className="flex gap-2">
                  <input placeholder="Duration" value={medicine.duration} onChange={e => updateMedicine(index, 'duration', e.target.value)} className="w-full flex-1 p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none" />
                  {medicines.length > 1 && <button onClick={() => removeMedicine(index)} className="px-3 text-red-500 font-bold cursor-pointer">✕</button>}
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase">Pathology Tests</h2>
              {loadingTests && <span className="text-xs text-blue-600">Loading...</span>}
            </div>
            <div className="flex gap-2">
              <select value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)} disabled={loadingTests} className="w-full flex-1 p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 outline-none">
                <option value="">Select Investigation</option>
                {availableTests.map(test => (
                  <option key={test.id} value={test.id}>{test.testName} - ₹{test.testPrice}</option>
                ))}
              </select>
              <button onClick={addLabTest} disabled={!selectedTestId} className="px-4 bg-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer">Add</button>
            </div>
            {!loadingTests && availableTests.length === 0 && <p className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs">No lab tests found.</p>}
            {selectedTests.map((test, index) => (
              <div key={test.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-xl text-xs font-bold">
                <span>🔬 {test.testName}</span>
                <div className="flex gap-3">
                  <span>₹{test.testPrice}</span>
                  <button onClick={() => removeLabTest(index)} className="text-red-500 cursor-pointer">✕</button>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase mb-4">Previous Consultations</h2>
            {oldPatient && patient?.prescriptions?.length ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {patient.prescriptions.map((p: any) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{p.diagnosis}</span>
                      <span className="text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{p.advice || '-'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-5">First clinical consultation.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}