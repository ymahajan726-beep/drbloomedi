'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { getAuthHeaders } from '@/utils/session';

interface MedicineItem {
  name: string;
  dosage: string;
  duration: string;
  instruction?: string;
}

export default function DoctorPortalPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After meals' },
  ]);
  const [advice, setAdvice] = useState('');
  const [submittingRx, setSubmittingRx] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [printedRx, setPrintedRx] = useState<any | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch('https://drbloomedi-backend.onrender.com/appointments', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
        if (data.length > 0 && !selectedApt) {
          handleSelectPatient(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (apt: any) => {
    setSelectedApt(apt);
    setDiagnosis('');
    setSymptoms('');
    setAdvice('');
    setMedicines([{ name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After meals' }]);
    setAiSuggestions(null);
    setAiSummary(null);

    if (apt?.patient?.id) {
      loadAiPatientSummary(apt.patient);
    }
  };

  const handleAiSuggestPrescription = async () => {
    if (!diagnosis.trim() && !symptoms.trim()) {
      showToast('Please enter clinical diagnosis or patient symptoms first.', 'error');
      return;
    }

    try {
      setAiLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch('https://drbloomedi-backend.onrender.com/ai/suggest-prescription', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ diagnosis, symptoms }),
      });

      if (!res.ok) throw new Error('AI suggestion failed');
      const data = await res.json();
      setAiSuggestions(data);
    } catch (err: any) {
      showToast(`AI Assistant Error: ${err.message}`, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiPrescription = () => {
    if (!aiSuggestions) return;
    if (aiSuggestions.recommendedMedicines) {
      setMedicines(aiSuggestions.recommendedMedicines);
    }
    if (aiSuggestions.clinicalAdvice) {
      setAdvice(aiSuggestions.clinicalAdvice);
    }
    if (!diagnosis && aiSuggestions.suggestedDiagnosis) {
      setDiagnosis(aiSuggestions.suggestedDiagnosis);
    }
  };

  const loadAiPatientSummary = async (patient: any) => {
    try {
      setSummaryLoading(true);
      const headers = getAuthHeaders();
      const histRes = await fetch(`https://drbloomedi-backend.onrender.com/patient-portal/history/${patient.id}`, {
        headers,
        credentials: 'include',
      }).catch(() => null);
      const histData = histRes?.ok ? await histRes.json() : {};

      const res = await fetch('https://drbloomedi-backend.onrender.com/ai/patient-summary', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          fullName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
          appointments: histData.appointments || [],
          prescriptions: histData.prescriptions || [],
          labOrders: histData.labOrders || [],
        }),
      });

      if (res.ok) {
        setAiSummary(await res.json());
      }
    } catch (err) {
      console.error('Failed to load AI summary', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After meals' }]);
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicineItem, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, idx) => idx !== index));
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt || !selectedApt.patient) {
      showToast('No patient selected', 'error');
      return;
    }
    if (!diagnosis.trim()) {
      showToast('Please provide a clinical diagnosis', 'error');
      return;
    }

    const validMeds = medicines.filter((m) => m.name.trim() !== '');
    if (validMeds.length === 0) {
      showToast('Please add at least one prescribed medicine', 'error');
      return;
    }

    try {
      setSubmittingRx(true);
      const headers = getAuthHeaders();
      const payload = {
        patientId: selectedApt.patient.id,
        doctorId: selectedApt.doctor?.id || selectedApt.doctorId || null,
        appointmentId: selectedApt.id || null,
        diagnosis,
        symptoms,
        advice,
        medicines: validMeds,
      };

      const res = await fetch('https://drbloomedi-backend.onrender.com/prescriptions', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to record prescription');
      const savedRx = await res.json();
      setPrintedRx({
        ...savedRx,
        patient: selectedApt.patient,
        doctor: selectedApt.doctor,
        medicines: validMeds,
        diagnosis,
        advice,
      });

      showToast('Prescription saved successfully!', 'success');
      loadAppointments();
    } catch (err: any) {
      showToast(`Submission Error: ${err.message}`, 'error');
    } finally {
      setSubmittingRx(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            DOC
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Doctor Consultation & AI Clinical Suite
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              AI-Assisted Prescription Suggester, EMR Summarizer & Digital Rx Generator
            </p>
          </div>
        </div>

        <button
          onClick={loadAppointments}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
        >
          <span>↻</span> Refresh Queue
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Queue Sidebar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Today's Queue ({appointments.length})
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                Live
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[600px] overflow-y-auto">
              {loading ? (
                <p className="py-12 text-center text-xs text-slate-500 font-mono">Loading appointments...</p>
              ) : appointments.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500">No appointments scheduled.</p>
              ) : (
                appointments.map((apt) => {
                  const isSelected = selectedApt?.id === apt.id;
                  return (
                    <div
                      key={apt.id}
                      onClick={() => handleSelectPatient(apt)}
                      className={`p-3 rounded-lg cursor-pointer transition text-xs my-1 ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-2xs border-l-2 border-emerald-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-xs">{apt.patient?.fullName || 'Walk-in Patient'}</p>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {apt.appointmentNumber || 'OPD'}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        Slot: {apt.timeSlot || '10:00 AM'} • Phone: {apt.patient?.phone}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Consultation Suite */}
          <div className="lg:col-span-2 space-y-5">
            {selectedApt && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Active Patient Dossier</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedApt.patient?.fullName}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Age: {selectedApt.patient?.age || '28'}y • Gender: {selectedApt.patient?.gender || 'Male'} • Blood: {selectedApt.patient?.bloodGroup || 'O+'}
                    </p>
                  </div>
                  {aiSummary?.riskStratification && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-3 py-1.5 rounded-lg text-right">
                      <span className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">
                        AI Risk Stratification
                      </span>
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        {aiSummary.riskStratification}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🧠</span>
                    <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">
                      AI EMR Longitudinal Summary
                    </span>
                    {summaryLoading && <span className="text-[10px] text-slate-400 font-mono">(Analyzing records...)</span>}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {aiSummary?.summaryBrief || 'Analyzing historical appointments, prescriptions and lab findings...'}
                  </p>
                  {aiSummary?.clinicalHighlights?.map((item: string, idx: number) => (
                    <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1">
                      <span>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmitPrescription}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Clinical Examination & Digital Rx
                </h3>
                <button
                  type="button"
                  onClick={handleAiSuggestPrescription}
                  disabled={aiLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <span>✨</span>
                  <span>{aiLoading ? 'Analyzing Protocol...' : 'AI Suggest Prescription'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Clinical Diagnosis *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Viral Pyrexia / Acute Bronchitis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-emerald-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Reported Symptoms / Clinical Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. High fever for 2 days, sore throat"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition font-medium"
                  />
                </div>
              </div>

              {aiSuggestions && (
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 font-bold text-indigo-900 dark:text-indigo-200">
                      <span>✨</span>
                      <span>AI Protocol Suggestion: {aiSuggestions.suggestedDiagnosis}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyAiPrescription}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-[11px] shadow-2xs transition cursor-pointer"
                    >
                      Apply AI Rx to Form →
                    </button>
                  </div>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    <span className="font-bold">Suggested Labs:</span>{' '}
                    {aiSuggestions.suggestedLabTests?.join(', ') || 'None required'}
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Prescribed Medicines ({medicines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    + Add Medicine Row
                  </button>
                </div>

                <div className="space-y-2">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Paracetamol 650mg)"
                          value={med.name}
                          onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Dosage (1-0-1)"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Duration (5 Days)"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold cursor-pointer border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Clinical Advice & Dietary Guidelines
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Drink 3 liters of warm water daily, take rest"
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRx}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                {submittingRx ? 'Finalizing Prescription...' : '✓ Finalize & Issue Digital Prescription'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {printedRx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 font-sans">
            <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded uppercase">
                  Official Medical Prescription
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">DRBLOOMEDI HEALTHCARE</h2>
              </div>
              <button
                onClick={() => setPrintedRx(null)}
                className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-500 hover:bg-slate-200 cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Patient</span>
                <p className="font-bold text-slate-900 dark:text-white">{printedRx.patient?.fullName}</p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {printedRx.patient?.age}y • {printedRx.patient?.gender} • {printedRx.patient?.phone}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Consulting Doctor</span>
                <p className="font-bold text-slate-900 dark:text-white">Dr. {printedRx.doctor?.specialization || 'Physician'}</p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Clinical Diagnosis</span>
              <p className="font-bold text-slate-900 dark:text-white p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700">
                {printedRx.diagnosis}
              </p>
            </div>

            <div className="text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Prescribed Medicines (Rx)</span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800/50">
                {printedRx.medicines.map((m: any, idx: number) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.instruction || 'As advised'}</p>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      {m.dosage} • {m.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {printedRx.advice && (
              <div className="text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Advice / Diet</span>
                <p className="text-slate-700 dark:text-slate-300 italic mt-0.5 font-normal">{printedRx.advice}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>🖨️</span> Print Prescription
              </button>
              <button
                type="button"
                onClick={() => setPrintedRx(null)}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
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