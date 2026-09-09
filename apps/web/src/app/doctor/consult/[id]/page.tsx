
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE =
  'https://drbloomedi-backend.onrender.com';

type LabTest = {
  id: string;
  testName: string;
  testPrice: number;
};

type Medicine = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export default function DoctorConsultPage() {
  const params = useParams();
  const appointmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patient, setPatient] = useState<any>(null);
  const [appointment, setAppointment] =
    useState<any>(null);
  const [oldPatient, setOldPatient] =
    useState(false);

  const [diagnosis, setDiagnosis] =
    useState('');
  const [clinicalNotes, setClinicalNotes] =
    useState('');
  const [followUpDate, setFollowUpDate] =
    useState('');

  const [medicines, setMedicines] =
    useState<Medicine[]>([
      {
        medicineName: '',
        dosage: '1 Tab',
        frequency: '1-0-1',
        duration: '5 Days',
        instructions: 'After food',
      },
    ]);

  const [availableTests, setAvailableTests] =
    useState<LabTest[]>([]);
  const [selectedTestId, setSelectedTestId] =
    useState('');
  const [selectedTests, setSelectedTests] =
    useState<LabTest[]>([]);
  const [loadingTests, setLoadingTests] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  useEffect(() => {
    if (!appointmentId) return;

    loadAppointment();
    loadLabTests();
  }, [appointmentId]);

  const getToken = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  const authHeaders = () => {
    const token = getToken();

    return {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // ============================================================
  // APPOINTMENT
  // ============================================================

  const loadAppointment = async () => {
    try {
      setLoading(true);

      let data: any = null;

      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}`,
        {
          headers: authHeaders(),
          cache: 'no-store',
        }
      );

      if (response.ok) {
        data = await response.json();
      } else {
        const listResponse = await fetch(
          `${API_BASE}/appointments`,
          {
            headers: authHeaders(),
            cache: 'no-store',
          }
        );

        if (listResponse.ok) {
          const list =
            await listResponse.json();

          if (Array.isArray(list)) {
            data = list.find(
              (item: any) =>
                String(item.id) ===
                String(appointmentId)
            );
          }
        }
      }

      if (!data) {
        throw new Error(
          'Appointment not found.'
        );
      }

      setAppointment(data);

      const patientData = data.patient;

      if (!patientData?.id) {
        setPatient(patientData);
        return;
      }

      const emrResponse = await fetch(
        `${API_BASE}/emr/patient/${patientData.id}`,
        {
          headers: authHeaders(),
          cache: 'no-store',
        }
      );

      if (emrResponse.ok) {
        const emr =
          await emrResponse.json();

        const loadedPatient =
          emr.patient || emr;

        const prescriptions =
          emr.prescriptions ||
          loadedPatient.prescriptions ||
          [];

        setPatient({
          ...patientData,
          ...loadedPatient,
          prescriptions,
          labOrders:
            emr.labOrders || [],
        });

        setOldPatient(
          prescriptions.length > 0
        );
      } else {
        setPatient(patientData);
      }

      if (data.symptoms) {
        setClinicalNotes(
          `Complaints: ${data.symptoms}`
        );
      }
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          'Unable to load appointment.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LAB TESTS
  // ============================================================

  const loadLabTests = async () => {
    try {
      setLoadingTests(true);

      const response = await fetch(
        `${API_BASE}/lab/tests`,
        {
          headers: authHeaders(),
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          'Unable to load laboratory tests.'
        );
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          'Invalid laboratory test response.'
        );
      }

      setAvailableTests(
        data
          .filter(
            (test: any) => test?.id
          )
          .map((test: any) => ({
            id: String(test.id),

            testName: String(
              test.testName ||
                test.name ||
                'Unnamed Test'
            ),

            testPrice: Number(
              test.price ??
                test.testPrice ??
                0
            ),
          }))
      );
    } catch (error) {
      console.error(
        'Lab test error:',
        error
      );

      setAvailableTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  const addLabTest = () => {
    if (!selectedTestId) return;

    const test =
      availableTests.find(
        item =>
          String(item.id) ===
          String(selectedTestId)
      );

    if (!test) {
      alert(
        'Selected laboratory test was not found.'
      );
      return;
    }

    if (
      selectedTests.some(
        item =>
          String(item.id) ===
          String(test.id)
      )
    ) {
      alert(
        'This test is already selected.'
      );
      return;
    }

    setSelectedTests(prev => [
      ...prev,
      test,
    ]);

    setSelectedTestId('');
  };

  const removeLabTest = (
    index: number
  ) => {
    setSelectedTests(prev =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  // ============================================================
  // MEDICINES
  // ============================================================

  const updateMedicine = (
    index: number,
    field: keyof Medicine,
    value: string
  ) => {
    setMedicines(prev =>
      prev.map((medicine, i) =>
        i === index
          ? {
              ...medicine,
              [field]: value,
            }
          : medicine
      )
    );
  };

  const addMedicine = () => {
    setMedicines(prev => [
      ...prev,
      {
        medicineName: '',
        dosage: '1 Tab',
        frequency: '1-0-1',
        duration: '3 Days',
        instructions: 'After food',
      },
    ]);
  };

  const removeMedicine = (
    index: number
  ) => {
    setMedicines(prev =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  // ============================================================
  // VOICE
  // ============================================================

  const startVoiceDictation = () => {
    const SpeechRecognition =
      (window as any)
        .SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Voice dictation is not supported in this browser.'
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () =>
      setListening(true);

    recognition.onend = () =>
      setListening(false);

    recognition.onerror = () =>
      setListening(false);

    recognition.onresult = (
      event: any
    ) => {
      const text =
        event.results?.[0]?.[0]
          ?.transcript || '';

      if (text) {
        setClinicalNotes(prev =>
          prev
            ? `${prev} ${text}`
            : text
        );
      }
    };

    recognition.start();
  };

  // ============================================================
  // SAVE CONSULTATION
  // ============================================================

  const saveConsultation = async () => {
    if (!diagnosis.trim()) {
      alert(
        'Please enter a diagnosis.'
      );
      return;
    }

    const patientId =
      patient?.id ||
      appointment?.patient?.id;

    if (!patientId) {
      alert(
        'Patient information is missing.'
      );
      return;
    }

    try {
      setSaving(true);

      const validMedicines =
        medicines
          .filter(
            medicine =>
              medicine.medicineName.trim()
          )
          .map(medicine => ({
            name:
              medicine.medicineName.trim(),

            dosage:
              medicine.dosage.trim() ||
              '1 Tab',

            freq:
              medicine.frequency.trim() ||
              '1-0-1',

            duration:
              medicine.duration.trim() ||
              '5 Days',

            notes:
              medicine.instructions.trim() ||
              'After food',
          }));

      // --------------------------------------------------------
      // 1. SAVE PRESCRIPTION
      // --------------------------------------------------------

      const prescriptionResponse =
        await fetch(
          `${API_BASE}/prescriptions`,
          {
            method: 'POST',
            headers: authHeaders(),

            body: JSON.stringify({
              patientId,

              doctorId:
                appointment?.doctor?.id ||
                appointment?.doctorId,

              appointmentId,

              diagnosis:
                diagnosis.trim(),

              symptoms:
                appointment?.symptoms ||
                '',

              advice:
                clinicalNotes.trim() +
                (followUpDate
                  ? `\nFollow-up: ${followUpDate}`
                  : ''),

              medicines:
                validMedicines,

              labTests:
                selectedTests.map(
                  test => test.testName
                ),
            }),
          }
        );

      if (!prescriptionResponse.ok) {
        throw new Error(
          await getErrorMessage(
            prescriptionResponse,
            'Failed to save prescription.'
          )
        );
      }

      // --------------------------------------------------------
      // 2. CREATE LAB ORDERS
      // --------------------------------------------------------

      if (selectedTests.length > 0) {
        const labResponse =
          await fetch(
            `${API_BASE}/lab/consultation-orders`,
            {
              method: 'POST',
              headers: authHeaders(),

              /*
               * IMPORTANT:
               * Backend gets doctor from appointment.
               * Therefore only these fields are sent.
               */
              body: JSON.stringify({
                appointmentId,
                patientId,

                labTestIds:
                  selectedTests.map(
                    test =>
                      String(test.id)
                  ),
              }),
            }
          );

        if (!labResponse.ok) {
          throw new Error(
            await getErrorMessage(
              labResponse,
              'Failed to transmit lab orders to Pathology Worklist.'
            )
          );
        }
      }

      // --------------------------------------------------------
      // 3. COMPLETE APPOINTMENT
      // --------------------------------------------------------

      if (appointmentId) {
        const statusResponse =
          await fetch(
            `${API_BASE}/appointments/${appointmentId}/status`,
            {
              method: 'PATCH',
              headers: authHeaders(),

              body: JSON.stringify({
                status: 'Completed',
              }),
            }
          );

        if (!statusResponse.ok) {
          console.warn(
            'Appointment status could not be updated.'
          );
        }
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      alert(
        selectedTests.length > 0
          ? 'Prescription and Lab Tests saved successfully! Transmitted to Pathology Worklist.'
          : 'Prescription saved successfully!'
      );

      window.print();
    } catch (error: any) {
      console.error(
        'Save consultation error:',
        error
      );

      alert(
        error?.message ||
          'Unable to complete consultation.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  const getErrorMessage = async (
    response: Response,
    fallback: string
  ) => {
    try {
      const data =
        await response.json();

      return (
        data?.message ||
        data?.error ||
        fallback
      );
    } catch {
      return fallback;
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-semibold">
        Loading patient clinical chart...
      </div>
    );
  }

  const patientName =
    patient?.fullName ||
    appointment?.patient?.fullName ||
    'Patient Consultation';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      <style>{`
        @media print {
          button,
          select,
          nav,
          header {
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

      {/* HEADER */}

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center gap-4">

        <div>
          <div className="flex items-center gap-3">

            <h1 className="text-2xl font-black text-slate-900">
              {patientName}
            </h1>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black ${
                oldPatient
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {oldPatient
                ? 'OLD PATIENT'
                : 'NEW PATIENT'}
            </span>

          </div>

          <p className="text-xs text-slate-500 mt-2">
            Phone:{' '}
            <b>
              {patient?.phone ||
                appointment?.patient?.phone ||
                'N/A'}
            </b>

            {' • '}

            Age:{' '}
            <b>
              {patient?.age ||
                'N/A'}{' '}
              Yrs
            </b>

            {' • '}

            Slot:{' '}
            <b className="text-blue-600">
              {appointment?.timeSlot ||
                'Scheduled'}
            </b>
          </p>
        </div>

        <div className="flex gap-2 print:hidden">

          <button
            onClick={() =>
              window.print()
            }
            className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
          >
            🖨️ Print
          </button>

          <button
            disabled={saving}
            onClick={
              saveConsultation
            }
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : '💾 Save Prescription'}
          </button>

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}

        <div className="lg:col-span-2 space-y-6">

          {/* CLINICAL */}

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">

            <h2 className="text-sm font-black text-slate-900 uppercase">
              Clinical Assessment
            </h2>

            <div>

              <label className="label">
                Diagnosis *
              </label>

              <input
                value={diagnosis}
                onChange={e =>
                  setDiagnosis(
                    e.target.value
                  )
                }
                placeholder="Enter diagnosis"
                className="input"
              />

            </div>

            <div>

              <div className="flex justify-between mb-1">

                <label className="label">
                  Clinical Advice & Notes
                </label>

                <button
                  type="button"
                  onClick={
                    startVoiceDictation
                  }
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                    listening
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  🎤{' '}
                  {listening
                    ? 'Listening...'
                    : 'Voice Dictate'}
                </button>

              </div>

              <textarea
                rows={4}
                value={clinicalNotes}
                onChange={e =>
                  setClinicalNotes(
                    e.target.value
                  )
                }
                placeholder="Clinical notes, advice..."
                className="input"
              />

            </div>

            <div>

              <label className="label">
                Next Follow-up
              </label>

              <input
                type="date"
                value={followUpDate}
                onChange={e =>
                  setFollowUpDate(
                    e.target.value
                  )
                }
                className="input"
              />

            </div>

          </section>

          {/* MEDICINES */}

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">

            <div className="flex justify-between items-center">

              <h2 className="text-sm font-black text-slate-900 uppercase">
                Prescribed Medicines
              </h2>

              <button
                onClick={addMedicine}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
              >
                + Add Medicine
              </button>

            </div>

            {medicines.map(
              (medicine, index) => (

                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl"
                >

                  <input
                    placeholder="Medicine name"
                    value={
                      medicine.medicineName
                    }
                    onChange={e =>
                      updateMedicine(
                        index,
                        'medicineName',
                        e.target.value
                      )
                    }
                    className="input"
                  />

                  <input
                    placeholder="Dosage"
                    value={
                      medicine.dosage
                    }
                    onChange={e =>
                      updateMedicine(
                        index,
                        'dosage',
                        e.target.value
                      )
                    }
                    className="input"
                  />

                  <select
                    value={
                      medicine.frequency
                    }
                    onChange={e =>
                      updateMedicine(
                        index,
                        'frequency',
                        e.target.value
                      )
                    }
                    className="input"
                  >
                    <option value="1-0-1">
                      1-0-1
                    </option>
                    <option value="1-1-1">
                      1-1-1
                    </option>
                    <option value="1-0-0">
                      1-0-0
                    </option>
                    <option value="0-0-1">
                      0-0-1
                    </option>
                    <option value="SOS">
                      SOS
                    </option>
                  </select>

                  <div className="flex gap-2">

                    <input
                      placeholder="Duration"
                      value={
                        medicine.duration
                      }
                      onChange={e =>
                        updateMedicine(
                          index,
                          'duration',
                          e.target.value
                        )
                      }
                      className="input flex-1"
                    />

                    {medicines.length >
                      1 && (
                      <button
                        onClick={() =>
                          removeMedicine(
                            index
                          )
                        }
                        className="px-3 text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    )}

                  </div>

                </div>
              )
            )}

          </section>

        </div>

        {/* RIGHT */}

        <div className="space-y-6">

          {/* LAB */}

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">

            <div className="flex justify-between">

              <h2 className="text-sm font-black text-slate-900 uppercase">
                Pathology Tests
              </h2>

              {loadingTests && (
                <span className="text-xs text-blue-600">
                  Loading...
                </span>
              )}

            </div>

            <div className="flex gap-2">

              <select
                value={selectedTestId}
                onChange={e =>
                  setSelectedTestId(
                    e.target.value
                  )
                }
                disabled={loadingTests}
                className="input flex-1"
              >

                <option value="">
                  Select Investigation
                </option>

                {availableTests.map(
                  test => (
                    <option
                      key={test.id}
                      value={test.id}
                    >
                      {test.testName} - ₹
                      {test.testPrice}
                    </option>
                  )
                )}

              </select>

              <button
                onClick={addLabTest}
                disabled={
                  !selectedTestId
                }
                className="px-4 bg-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Add
              </button>

            </div>

            {!loadingTests &&
              availableTests.length ===
                0 && (
                <p className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs">
                  No laboratory tests found in backend.
                </p>
              )}

            {selectedTests.map(
              (test, index) => (

                <div
                  key={test.id}
                  className="flex justify-between items-center p-3 bg-purple-50 rounded-xl text-xs font-bold"
                >

                  <span>
                    🔬 {test.testName}
                  </span>

                  <div className="flex gap-3">

                    <span>
                      ₹{test.testPrice}
                    </span>

                    <button
                      onClick={() =>
                        removeLabTest(
                          index
                        )
                      }
                      className="text-red-500"
                    >
                      ✕
                    </button>

                  </div>

                </div>
              )
            )}

          </section>

          {/* HISTORY */}

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">

            <h2 className="text-sm font-black text-slate-900 uppercase mb-4">
              Previous Consultations
            </h2>

            {oldPatient &&
            patient?.prescriptions
              ?.length ? (

              <div className="space-y-2 max-h-64 overflow-y-auto">

                {patient.prescriptions.map(
                  (
                    prescription: any
                  ) => (

                    <div
                      key={
                        prescription.id
                      }
                      className="p-3 bg-slate-50 rounded-xl"
                    >

                      <div className="flex justify-between text-xs font-bold">

                        <span>
                          {
                            prescription.diagnosis
                          }
                        </span>

                        <span className="text-slate-400">

                          {prescription.createdAt
                            ? new Date(
                                prescription.createdAt
                              ).toLocaleDateString()
                            : '-'}

                        </span>

                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        {
                          prescription.advice ||
                          '-'
                        }
                      </p>

                    </div>
                  )
                )}

              </div>

            ) : (

              <p className="text-xs text-slate-400 text-center py-5">
                First clinical consultation.
              </p>

            )}

          </section>

        </div>

      </div>

      <style jsx>{`
        .label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .input {
          width: 100%;
          padding: 10px;
          font-size: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          outline: none;
          background: white;
          color: #0f172a;
        }

        .input:focus {
          border-color: #2563eb;
        }
      `}</style>

    </div>
  );
}
