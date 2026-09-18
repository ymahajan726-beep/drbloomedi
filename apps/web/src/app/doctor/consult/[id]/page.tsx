'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { getAuthHeaders } from '@/utils/session';

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

  const loadAppointment = async () => {
    try {
      setLoading(true);
      let data: any = null;
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE}/appointments/${appointmentId}`, { headers, cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        data = await res.json();
      } else {
        const listRes = await fetch(`${API_BASE}/appointments`, { headers, cache: 'no-store', credentials: 'include' });
        if (listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list)) data = list.find((i: any) => String(i.id) === String(appointmentId));
        }
      }
      if (!data) throw new Error('Appointment not found.');
      setAppointment(data);

      const patientData = data.patient;
      if (!patientData?.id) { setPatient(patientData); return; }

      const emrRes = await fetch(`${API_BASE}/emr/patient/${patientData.id}`, { headers, cache: 'no-store', credentials: 'include' });
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
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE}/lab/tests`, { headers, cache: 'no-store', credentials: 'include' });
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
      const headers = getAuthHeaders();
      const validMedicines = medicines.filter(m => m.medicineName.trim()).map(m => ({
        name: m.medicineName.trim(), dosage: m.dosage.trim() || '1 Tab', freq: m.frequency.trim() || '1-0-1', duration: m.duration.trim() || '5 Days', notes: m.instructions.trim() || 'After food'
      }));

      const presRes = await fetch(`${API_BASE}/prescriptions`, {
        method: 'POST', headers, credentials: 'include',
        body: JSON.stringify({
          patientId, doctorId: appointment?.doctor?.id || appointment?.doctorId, appointmentId,
          diagnosis: diagnosis.trim(), symptoms: appointment?.symptoms || '',
          advice: clinicalNotes.trim() + (followUpDate ? `\nFollow-up: ${followUpDate}` : ''),
          medicines: validMedicines, labTests: selectedTests.map(t => t.testName),
        }),
      });
      if (!presRes.ok) throw new Error('Failed to save prescription.');

      if (selectedTests.length > 0) {
        const labRes = await fetch(`${API_BASE}/lab/consultation-orders`, {
          method: 'POST', headers, credentials: 'include',
          body: JSON.stringify({ appointmentId, patientId, labTestIds: selectedTests.map(t => String(t.id)) }),
        });
        if (!labRes.ok) throw new Error('Failed to transmit lab orders.');
      }

      if (appointmentId) {
        await fetch(`${API_BASE}/appointments/${appointmentId}/status`, {
          method: 'PATCH', headers, credentials: 'include', body: JSON.stringify({ status: 'Completed' }),
        });
      }

      showToast(selectedTests.length > 0 ? 'Saved! Transmitted to Reception & Pathology.' : 'Saved! Transmitted to Reception billing queue.', 'success');
      window.print();
    } catch (err: any) {
      showToast(err?.message || 'Unable to complete consultation.', 'error');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Loading patient clinical chart...
      </div>
    );
  }

  const patientName = patient?.fullName || appointment?.patient?.fullName || 'Patient Consultation';
  const field = 'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      <style>{`@media print { button, select, nav, header { display: none !important; } body { background: white !important; } @page { size: A4; margin: 12mm 15mm; } }`}</style>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            DOC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                {patientName}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${oldPatient ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'}`}>
                {oldPatient ? 'OLD PATIENT' : 'NEW PATIENT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Phone: {patient?.phone || appointment?.patient?.phone || 'N/A'} • Age: {patient?.age || 'N/A'} Yrs • Slot: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{appointment?.timeSlot || 'Scheduled'}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs">
            🖨️ Print
          </button>
          <button disabled={saving} onClick={saveConsultation} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer">
            {saving ? 'Saving...' : '💾 Save & Complete Consultation'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Clinical Assessment
              </h2>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Diagnosis *</label>
                <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" className={field} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase">Clinical Advice & Notes</label>
                  <button type="button" onClick={startVoiceDictation} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer border transition shadow-2xs ${listening ? 'bg-rose-600 text-white border-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}>
                    🎤 {listening ? 'Listening...' : 'Voice Dictate'}
                  </button>
                </div>
                <textarea rows={4} value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} placeholder="Clinical notes, advice..." className={`${field} resize-none`} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Next Follow-up</label>
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className={field} />
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Prescribed Medicines</h2>
                <button onClick={addMedicine} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">+ Add Medicine</button>
              </div>
              <div className="space-y-3">
                {medicines.map((medicine, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs items-center">
                    <input placeholder="Medicine name" value={medicine.medicineName} onChange={e => updateMedicine(index, 'medicineName', e.target.value)} className={field} />
                    <input placeholder="Dosage" value={medicine.dosage} onChange={e => updateMedicine(index, 'dosage', e.target.value)} className={field} />
                    <select value={medicine.frequency} onChange={e => updateMedicine(index, 'frequency', e.target.value)} className={field}>
                      <option value="1-0-1">1-0-1</option><option value="1-1-1">1-1-1</option><option value="1-0-0">1-0-0</option><option value="0-0-1">0-0-1</option><option value="SOS">SOS</option>
                    </select>
                    <div className="flex gap-2 items-center">
                      <input placeholder="Duration" value={medicine.duration} onChange={e => updateMedicine(index, 'duration', e.target.value)} className={field} />
                      {medicines.length > 1 && <button onClick={() => removeMedicine(index)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold flex items-center justify-center cursor-pointer shrink-0">✕</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pathology Tests</h2>
                {loadingTests && <span className="text-xs text-slate-400 font-mono">Loading...</span>}
              </div>
              <div className="flex gap-2 text-xs">
                <select value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)} disabled={loadingTests} className={field}>
                  <option value="">Select Investigation</option>
                      {availableTests.map(test => (
                        <option key={test.id} value={test.id}>{test.testName} - ₹{test.testPrice}</option>
                      ))}
                    </select>
                    <button onClick={addLabTest} disabled={!selectedTestId} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer shrink-0">Add</button>
                  </div>
                  {!loadingTests && availableTests.length === 0 && <p className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-900">No lab tests found.</p>}
                  <div className="space-y-2">
                    {selectedTests.map((test, index) => (
                      <div key={test.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs border border-slate-200/80 dark:border-slate-700 font-semibold">
                        <span className="text-slate-900 dark:text-white">🔬 {test.testName}</span>
                        <div className="flex gap-3 items-center">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{test.testPrice}</span>
                          <button onClick={() => removeLabTest(index)} className="w-6 h-6 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center cursor-pointer">✕</button>
                        </div>
                      </div>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">Previous Consultations</h2>
              {oldPatient && patient?.prescriptions?.length ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {patient.prescriptions.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                        <span>{p.diagnosis}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] font-normal">{p.advice || '-'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6 font-medium">First clinical consultation.</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}