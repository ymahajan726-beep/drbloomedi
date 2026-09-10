'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

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

  // Clinical Consultation State
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { name: '', dosage: '1-0-1', duration: '5 Days', instruction: 'After meals' },
  ]);
  const [advice, setAdvice] = useState('');
  const [submittingRx, setSubmittingRx] = useState(false);

  // AI Assistant States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Printable Rx Modal State
  const [printedRx, setPrintedRx] = useState<any | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/appointments');
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

    // Auto-fetch AI Longitudinal Summary for this patient
    if (apt?.patient?.id) {
      loadAiPatientSummary(apt.patient);
    }
  };

  // 1. Trigger AI Prescription Assistant
  const handleAiSuggestPrescription = async () => {
    if (!diagnosis.trim() && !symptoms.trim()) {
      showToast('Please enter clinical diagnosis or patient symptoms first.', 'error');
      return;
    }

    try {
      setAiLoading(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/ai/suggest-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Apply AI Suggestions directly into the Prescription form
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

  // 2. Fetch AI Longitudinal EMR Summary
  const loadAiPatientSummary = async (patient: any) => {
    try {
      setSummaryLoading(true);
      // Fetch full patient history for EMR summarization
      const histRes = await fetch(`https://drbloomedi-backend.onrender.com/patient-portal/history/${patient.id}`).catch(() => null);
      const histData = histRes?.ok ? await histRes.json() : {};

      const res = await fetch('https://drbloomedi-backend.onrender.com/ai/patient-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Medicine Table Handlers
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

  // Submit Prescription to Backend
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
        headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full uppercase">
            Module 2 • Clinical Doctor Station
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Doctor Consultation & AI Clinical Suite
          </h1>
          <p className="text-xs text-slate-500">
            AI-Assisted Prescription Suggester, EMR Summarizer & Digital Rx Generator
          </p>
        </div>
        <button
          onClick={loadAppointments}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold self-start md:self-auto"
        >
          🔄 Refresh Patient Queue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Waiting Patient Queue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-900 uppercase">
              Today's Queue ({appointments.length})
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-xs text-slate-400">Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No appointments scheduled.</p>
            ) : (
              appointments.map((apt) => {
                const isSelected = selectedApt?.id === apt.id;
                return (
                  <div
                    key={apt.id}
                    onClick={() => handleSelectPatient(apt)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition text-xs my-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm">{apt.patient?.fullName || 'Walk-in Patient'}</p>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {apt.appointmentNumber || 'OPD'}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      Slot: {apt.timeSlot || '10:00 AM'} • Phone: {apt.patient?.phone}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Active Consultation & AI Assistant */}
        <div className="lg:col-span-2 space-y-5">
          {/* Patient Overview & AI EMR Longitudinal Summary Card */}
          {selectedApt && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Active Patient</span>
                  <h2 className="text-lg font-black text-slate-900">{selectedApt.patient?.fullName}</h2>
                  <p className="text-xs text-slate-500">
                    Age: {selectedApt.patient?.age || '28'}y • Gender: {selectedApt.patient?.gender || 'Male'} • Blood: {selectedApt.patient?.bloodGroup || 'O+'}
                  </p>
                </div>
                {aiSummary?.riskStratification && (
                  <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-2xl text-right">
                    <span className="text-[9px] font-black uppercase text-indigo-500 block">
                      AI Risk Stratification
                    </span>
                    <span className="text-xs font-black text-indigo-900">
                      {aiSummary.riskStratification}
                    </span>
                  </div>
                )}
              </div>

              {/* AI Clinical Brief */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🧠</span>
                  <span className="font-black text-slate-800 uppercase text-[10px] tracking-wider">
                    AI EMR Longitudinal Summary
                  </span>
                  {summaryLoading && <span className="text-[10px] text-slate-400">(Analyzing records...)</span>}
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {aiSummary?.summaryBrief || 'Analyzing historical appointments, prescriptions and lab findings...'}
                </p>
                {aiSummary?.clinicalHighlights?.map((item: string, idx: number) => (
                  <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-1">
                    <span>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consultation Prescription Form */}
          <form
            onSubmit={handleSubmitPrescription}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Clinical Examination & Digital Rx
              </h3>
              <button
                type="button"
                onClick={handleAiSuggestPrescription}
                disabled={aiLoading}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition"
              >
                <span>✨</span>
                <span>{aiLoading ? 'Analyzing Protocol...' : 'AI Suggest Prescription'}</span>
              </button>
            </div>

            {/* Inputs: Diagnosis & Symptoms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Viral Pyrexia / Acute Bronchitis / Gastritis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Reported Symptoms / Clinical Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. High fever for 2 days, sore throat, severe headache"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* AI SUGGESTION BANNER IF AVAILABLE */}
            {aiSuggestions && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 font-bold text-indigo-950">
                    <span>✨</span>
                    <span>AI Protocol Suggestion: {aiSuggestions.suggestedDiagnosis}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAiPrescription}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition"
                  >
                    Apply AI Rx to Form →
                  </button>
                </div>
                <p className="text-[11px] text-indigo-800">
                  <span className="font-bold">Suggested Labs:</span>{' '}
                  {aiSuggestions.suggestedLabTests?.join(', ') || 'None required'}
                </p>
              </div>
            )}

            {/* Prescribed Medicines Dynamic Table */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Prescribed Medicines ({medicines.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
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
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1-0-1)"
                        value={med.dosage}
                        onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Duration (e.g. 5 Days)"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Advice */}
            <div className="text-xs">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Clinical Advice & Dietary Guidelines
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Drink 3 liters of warm water daily, take rest, revisit OPD if fever persists > 3 days"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRx}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              {submittingRx ? 'Finalizing Prescription...' : '✓ Finalize & Issue Digital Prescription'}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL: OFFICIAL PRINTABLE PRESCRIPTION */}
      {printedRx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 font-sans">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full uppercase">
                  Official Medical Prescription
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">DRBLOOMEDI HEALTHCARE</h2>
              </div>
              <button
                onClick={() => setPrintedRx(null)}
                className="w-7 h-7 bg-slate-100 rounded-full font-bold text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Patient</span>
                <p className="font-bold text-slate-900">{printedRx.patient?.fullName}</p>
                <p className="text-slate-500">
                  {printedRx.patient?.age}y • {printedRx.patient?.gender} • {printedRx.patient?.phone}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Consulting Doctor</span>
                <p className="font-bold text-slate-900">Dr. {printedRx.doctor?.specialization || 'Physician'}</p>
                <p className="text-slate-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Clinical Diagnosis</span>
              <p className="font-bold text-slate-900 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                {printedRx.diagnosis}
              </p>
            </div>

            <div className="text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Prescribed Medicines (Rx)</span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl p-2.5 bg-slate-50">
                {printedRx.medicines.map((m: any, idx: number) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.instruction || 'As advised'}</p>
                    </div>
                    <span className="font-mono text-slate-700 font-bold">
                      {m.dosage} • {m.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {printedRx.advice && (
              <div className="text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Advice / Diet</span>
                <p className="text-slate-700 italic mt-0.5">{printedRx.advice}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-md"
              >
                <span>🖨️</span> Print Prescription
              </button>
              <button
                type="button"
                onClick={() => setPrintedRx(null)}
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