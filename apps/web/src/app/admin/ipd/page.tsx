'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { getActiveToken, getAuthHeaders } from '@/utils/session';

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

  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState<IpdAdmission | null>(null);

 
  const [newBedNumber, setNewBedNumber] = useState('');
  const [newWardType, setNewWardType] = useState('General Ward');
  const [newDailyRate, setNewDailyRate] = useState('500');

   const [admitPatientId, setAdmitPatientId] = useState('');
  const [admitBedId, setAdmitBedId] = useState('');
  const [admitDoctorId, setAdmitDoctorId] = useState('');
  const [admitDiagnosis, setAdmitDiagnosis] = useState('');


  const [dischargeSummaryText, setDischargeSummaryText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const token = getActiveToken();
    const role = sessionStorage.getItem('userRole')?.toUpperCase();

    if (
      !token ||
      (role !== 'ADMIN' && role !== 'RECEPTION' && role !== 'DOCTOR')
    ) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  const loadIpdData = async () => {
    try {
      setLoading(true);
      const [bedsRes, admissionsRes, patientsRes, docsRes] = await Promise.all([
        fetch('https://drbloomedi-backend.onrender.com/ipd/beds', {
          headers: getAuthHeaders(),
        }),
        fetch('https://drbloomedi-backend.onrender.com/ipd/admissions?status=Admitted', {
          headers: getAuthHeaders(),
        }),
        fetch('https://drbloomedi-backend.onrender.com/patients', {
          headers: getAuthHeaders(),
        }),
        fetch('https://drbloomedi-backend.onrender.com/doctors', {
          headers: getAuthHeaders(),
        }),
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

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/ipd/beds', {
        method: 'POST',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeTarget) return;

    try {
      setActionLoading(true);
      const res = await fetch(
        `https://drbloomedi-backend.onrender.com/ipd/discharge/${dischargeTarget.id}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            dischargeSummary: dischargeSummaryText,
          }),
        }
      );

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

  const filteredBeds = wardFilter
    ? beds.filter((b) => b.wardType === wardFilter)
    : beds;

  const availableBeds = beds.filter((b) => b.status === 'Available');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 font-mono text-xs">
        🔒 Verifying IPD & Ward Access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            IPD
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              IPD & Bed / Ward Management
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live Bed Occupancy • In-Patient Admissions • Clinical Discharge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBedModalOpen(true)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <span>+</span> Add Bed
          </button>

          <button
            onClick={() => setIsAdmitModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>🛏️</span> Admit Patient
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Beds</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{beds.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base border border-blue-200 dark:border-blue-900 font-mono font-bold">
              {beds.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{availableBeds.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base border border-emerald-200 dark:border-emerald-900 font-mono font-bold">
              {availableBeds.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Occupied</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{beds.filter((b) => b.status === 'Occupied').length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-base border border-rose-200 dark:border-rose-900 font-mono font-bold">
              {beds.filter((b) => b.status === 'Occupied').length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active In-Patients</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{admissions.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base border border-purple-200 dark:border-purple-900 font-mono font-bold">
              {admissions.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ward & Bed Occupancy Matrix
            </h2>

            <div className="flex items-center gap-2">
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-600 transition"
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
            <p className="text-center text-xs text-slate-500 py-12">
              No beds added yet. Click &quot;+ Add Bed&quot; to set up your wards.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredBeds.map((bed) => {
                const isOccupied = bed.status === 'Occupied';

                return (
                  <div
                    key={bed.id}
                    className={`p-3.5 rounded-lg border flex flex-col justify-between transition ${
                      isOccupied
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                        : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs">
                        {bed.bedNumber}
                      </span>

                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                          isOccupied
                            ? 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                            : 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                        }`}
                      >
                        {bed.status}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] block opacity-75 font-medium">
                        {bed.wardType}
                      </span>
                      <span className="text-[11px] font-bold font-mono">
                        ₹{bed.dailyRate}/day
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

    
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Currently Admitted Patients ({admissions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[10px]">
                <tr>
                  <th className="py-3 px-3">Admission #</th>
                  <th className="py-3 px-3">Patient Details</th>
                  <th className="py-3 px-3">Assigned Bed</th>
                  <th className="py-3 px-3">Attending Doctor</th>
                  <th className="py-3 px-3">Admission Diagnosis</th>
                  <th className="py-3 px-3">Admitted On</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500 font-mono text-xs"
                    >
                      Loading admissions...
                    </td>
                  </tr>
                ) : admissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500 text-xs font-medium"
                    >
                      No active admissions at present.
                    </td>
                  </tr>
                ) : (
                  admissions.map((adm) => (
                    <tr
                      key={adm.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {adm.admissionNumber}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div>{adm.patient?.fullName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                          {adm.patient?.phone}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {adm.bed?.bedNumber}
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {adm.bed?.wardType}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {adm.doctor
                          ? `Dr. ${adm.doctor.user?.email?.split('@')[0]}`
                          : 'General Duty Medical Officer'}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 italic max-w-xs truncate">
                        {adm.admissionDiagnosis || 'Clinical Observation'}
                      </td>

                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(adm.admittedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setDischargeTarget(adm)}
                          className="px-3 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
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
      </main>

      {isBedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Add New Hospital Bed
            </h3>

            <form onSubmit={handleCreateBed} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Bed Number *
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. GW-101, ICU-02"
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 uppercase font-medium transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Ward Type
                </label>

                <select
                  value={newWardType}
                  onChange={(e) => setNewWardType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
                >
                  <option value="General Ward">General Ward</option>
                  <option value="ICU">ICU</option>
                  <option value="Private Room">Private Room</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Daily Rate (₹)
                </label>

                <input
                  type="number"
                  required
                  value={newDailyRate}
                  onChange={(e) => setNewDailyRate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-mono font-medium transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBedModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              In-Patient Admission
            </h3>

            <form onSubmit={handleAdmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Select Patient *
                </label>

                <select
                  required
                  value={admitPatientId}
                  onChange={(e) => setAdmitPatientId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Select Available Bed * ({availableBeds.length} available)
                </label>

                <select
                  required
                  value={admitBedId}
                  onChange={(e) => setAdmitBedId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 outline-none focus:border-emerald-600 font-medium transition"
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Attending Doctor (Optional)
                </label>

                <select
                  value={admitDoctorId}
                  onChange={(e) => setAdmitDoctorId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition"
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Provisional Diagnosis
                </label>

                <textarea
                  rows={2}
                  placeholder="e.g. Acute appendicitis, severe dehydration..."
                  value={admitDiagnosis}
                  onChange={(e) => setAdmitDiagnosis(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer"
                >
                  {actionLoading ? 'Admitting...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dischargeTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Discharge Patient & Release Bed
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Patient:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {dischargeTarget.patient?.fullName}
              </strong>{' '}
              • Bed:{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-mono">
                {dischargeTarget.bed?.bedNumber}
              </strong>
            </p>

            <form onSubmit={handleDischarge} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Discharge Summary & Advice
                </label>

                <textarea
                  rows={3}
                  required
                  placeholder="Patient recovered, vitals stable, post-op instructions..."
                  value={dischargeSummaryText}
                  onChange={(e) => setDischargeSummaryText(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 font-medium transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDischargeTarget(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer"
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