'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
}

interface Doctor {
  id: number;
  specialization: string;
  user?: { email: string };
}

interface Bed {
  id: string;
  bedNumber: string;
  wardType: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  dailyRate: number;
}

interface IpdAdmission {
  id: string;
  admissionNumber: string;
  status: string;
  admissionDiagnosis?: string;
  dischargeSummary?: string;
  admittedAt: string;
  dischargedAt?: string;
  patient?: Patient;
  doctor?: Doctor;
  bed?: Bed;
}

export default function IpdManagementPage() {
  const { showToast } = useToast();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Modals
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState<IpdAdmission | null>(null);

  // Form states: New Bed
  const [newBedNumber, setNewBedNumber] = useState('');
  const [newWardType, setNewWardType] = useState('General Ward');
  const [newDailyRate, setNewDailyRate] = useState('500');

  // Form states: New Admission
  const [admitPatientId, setAdmitPatientId] = useState('');
  const [admitBedId, setAdmitBedId] = useState('');
  const [admitDoctorId, setAdmitDoctorId] = useState('');
  const [admitDiagnosis, setAdmitDiagnosis] = useState('');

  // Form states: Discharge
  const [dischargeSummaryText, setDischargeSummaryText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Auth Guard
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const role = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();

    if (!token || (role !== 'ADMIN' && role !== 'RECEPTION' && role !== 'DOCTOR')) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  // 2. Fetch Data
  const loadIpdData = async () => {
    try {
      setLoading(true);
      const [bedsRes, admissionsRes, patientsRes, docsRes] = await Promise.all([
        fetch('https://drbloomedi-backend.onrender.com/ipd/beds'),
        fetch('https://drbloomedi-backend.onrender.com/ipd/admissions?status=Admitted'),
        fetch('https://drbloomedi-backend.onrender.com/patients'),
        fetch('https://drbloomedi-backend.onrender.com/doctors'),
      ]);

      if (bedsRes.ok) setBeds(await bedsRes.json());
      if (admissionsRes.ok) setAdmissions(await admissionsRes.json());
      if (patientsRes.ok) setPatients(await patientsRes.json());
      if (docsRes.ok) setDoctors(await docsRes.json());
    } catch (err) {
      console.error('Failed to load IPD metadata', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadIpdData();
    }
  }, [isAuthorized]);

  // 3. Create Bed
  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/ipd/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedNumber: newBedNumber,
          wardType: newWardType,
          dailyRate: Number(newDailyRate),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to create bed');
      }

      setIsBedModalOpen(false);
      setNewBedNumber('');
      setNewDailyRate('500');
      loadIpdData();
      showToast('Bed created successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error adding bed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Admit Patient
  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitPatientId || !admitBedId) {
      showToast('Patient and Bed are mandatory', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/ipd/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: admitPatientId,
          bedId: admitBedId,
          doctorId: admitDoctorId ? Number(admitDoctorId) : undefined,
          admissionDiagnosis: admitDiagnosis,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to admit patient');
      }

      setIsAdmitModalOpen(false);
      setAdmitPatientId('');
      setAdmitBedId('');
      setAdmitDoctorId('');
      setAdmitDiagnosis('');
      loadIpdData();
      showToast('Patient admitted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error admitting patient', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Discharge Patient
  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeTarget) return;

    try {
      setActionLoading(true);
      const res = await fetch(`https://drbloomedi-backend.onrender.com/ipd/discharge/${dischargeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dischargeSummary: dischargeSummaryText,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to discharge patient');
      }

      setDischargeTarget(null);
      setDischargeSummaryText('');
      loadIpdData();
      showToast('Patient discharged successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Discharge failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBeds = wardFilter ? beds.filter((b) => b.wardType === wardFilter) : beds;
  const availableBeds = beds.filter((b) => b.status === 'Available');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-900 font-mono text-xs">
        🔒 Verifying IPD & Ward Access...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">IPD & Bed / Ward Management</h1>
          <p className="text-xs text-slate-400">Live Bed Occupancy • In-Patient Admissions • Clinical Discharge</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBedModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>+</span> Add Bed
          </button>

          <button
            onClick={() => setIsAdmitModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>🛏️</span> Admit Patient
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Beds</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{beds.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Available</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{availableBeds.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-rose-600 uppercase">Occupied</p>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {beds.filter((b) => b.status === 'Occupied').length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-purple-600 uppercase">Active In-Patients</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{admissions.length}</p>
        </div>
      </div>

      {/* Bed Matrix Grid Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ward & Bed Occupancy Matrix</h2>

          <div className="flex items-center gap-2">
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none"
            >
              <option value="">All Wards</option>
              <option value="General Ward">General Ward</option>
              <option value="ICU">ICU</option>
              <option value="Private Room">Private Room</option>
              <option value="Semi-Private">Semi-Private</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </div>

        {beds.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">
            No beds added yet. Click "+ Add Bed" to set up your wards.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredBeds.map((bed) => {
              const isOccupied = bed.status === 'Occupied';
              return (
                <div
                  key={bed.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                    isOccupied
                      ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-sm">{bed.bedNumber}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isOccupied ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] block opacity-75 font-medium">{bed.wardType}</span>
                    <span className="text-[11px] font-bold">₹{bed.dailyRate}/day</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active IPD In-Patients Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Currently Admitted Patients ({admissions.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Admission #</th>
                <th className="p-3.5">Patient Details</th>
                <th className="p-3.5">Assigned Bed</th>
                <th className="p-3.5">Attending Doctor</th>
                <th className="p-3.5">Admission Diagnosis</th>
                <th className="p-3.5">Admitted On</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading admissions...</td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No active admissions at present.
                  </td>
                </tr>
              ) : (
                admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-600">{adm.admissionNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{adm.patient?.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{adm.patient?.phone}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {adm.bed?.bedNumber}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{adm.bed?.wardType}</span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {adm.doctor ? `Dr. ${adm.doctor.user?.email?.split('@')[0]}` : 'General Duty Medical Officer'}
                    </td>
                    <td className="p-3.5 text-slate-700 italic max-w-xs truncate">
                      {adm.admissionDiagnosis || 'Clinical Observation'}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(adm.admittedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setDischargeTarget(adm)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition"
                      >
                        Discharge Patient
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ADD BED MODAL */}
      {isBedModalOpen && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">Add New Hospital Bed</h3>
            <form onSubmit={handleCreateBed} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bed Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GW-101, ICU-02"
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ward Type</label>
                <select
                  value={newWardType}
                  onChange={(e) => setNewWardType(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50"
                >
                  <option value="General Ward">General Ward</option>
                  <option value="ICU">ICU</option>
                  <option value="Private Room">Private Room</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Daily Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={newDailyRate}
                  onChange={(e) => setNewDailyRate(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBedModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  {actionLoading ? 'Saving...' : 'Save Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADMIT PATIENT MODAL */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">In-Patient Admission</h3>

            <form onSubmit={handleAdmit} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Select Patient *</label>
                <select
                  required
                  value={admitPatientId}
                  onChange={(e) => setAdmitPatientId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} • {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Select Available Bed * ({availableBeds.length} available)
                </label>
                <select
                  required
                  value={admitBedId}
                  onChange={(e) => setAdmitBedId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50 text-blue-700"
                >
                  <option value="">-- Choose Bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.wardType}) - ₹{b.dailyRate}/day
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Attending Doctor (Optional)</label>
                <select
                  value={admitDoctorId}
                  onChange={(e) => setAdmitDoctorId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none bg-slate-50"
                >
                  <option value="">-- None / General Care --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.user?.email || 'Doctor'} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Provisional Diagnosis</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Acute appendicitis, severe dehydration..."
                  value={admitDiagnosis}
                  onChange={(e) => setAdmitDiagnosis(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  {actionLoading ? 'Admitting...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DISCHARGE MODAL */}
      {dischargeTarget && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">Discharge Patient & Release Bed</h3>
            <p className="text-xs text-slate-500 mt-1">
              Patient: <strong className="text-slate-800">{dischargeTarget.patient?.fullName}</strong> • Bed:{' '}
              <strong className="text-blue-600">{dischargeTarget.bed?.bedNumber}</strong>
            </p>

            <form onSubmit={handleDischarge} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Discharge Summary & Advice</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Patient recovered, vitals stable, post-op instructions..."
                  value={dischargeSummaryText}
                  onChange={(e) => setDischargeSummaryText(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDischargeTarget(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}