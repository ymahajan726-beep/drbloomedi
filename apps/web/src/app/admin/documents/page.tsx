'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function DocumentVaultPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [docType, setDocType] = useState('LAB_REPORT');
  const [remarks, setRemarks] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, patientsRes] = await Promise.all([
        fetch('https://drbloomedi-backend.onrender.com/documents').then((r) => (r.ok ? r.json() : [])),
        fetch('https://drbloomedi-backend.onrender.com/patients').then((r) => (r.ok ? r.json() : [])),
      ]);
      setDocuments(Array.isArray(docsRes) ? docsRes : []);
      setPatients(Array.isArray(patientsRes) ? patientsRes : []);
    } catch (err) {
      console.error('Failed to load documents data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a document or scan file to upload', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedPatientId) formData.append('patientId', selectedPatientId);
      formData.append('documentType', docType);
      if (remarks) formData.append('remarks', remarks);

      const res = await fetch('https://drbloomedi-backend.onrender.com/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'File upload failed');
      }

      const uploadedDoc = await res.json();
      setDocuments((prev) => [uploadedDoc, ...prev]);

      setSelectedFile(null);
      setRemarks('');
      showToast('Medical document uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(`Upload Error: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase();
    const origName = (doc.originalName || '').toLowerCase();
    const patName = (doc.patient?.fullName || '').toLowerCase();
    const type = (doc.documentType || '').toLowerCase();
    return origName.includes(q) || patName.includes(q) || type.includes(q);
  });

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
              Medical Records & Report Storage
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Securely upload, archive, and view diagnostic scans, lab PDFs, and medical records
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
        >
          <span>↻</span> Refresh Vault
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Upload Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Upload New Clinical Document
            </h2>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              {/* Patient Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Attach to Patient (Optional)
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-emerald-600 transition"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Document Category *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-emerald-600 transition"
                >
                  <option value="LAB_REPORT">Lab Test Report (PDF)</option>
                  <option value="XRAY_SCAN">Radiology / X-Ray Scan</option>
                  <option value="PRESCRIPTION_SCAN">Prescription Scan</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="OTHER">Other Clinical Attachment</option>
                </select>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Select File (PDF, PNG, JPG) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-950/50 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 transition cursor-pointer"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Clinical Remarks / Doctor Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chest X-ray clear, verified by radiologist"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-emerald-600 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                {uploading ? 'Archiving & Uploading...' : '📁 Upload to Clinical Storage'}
              </button>
            </form>
          </div>

          {/* Right 2 Columns: Archived Documents List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Document Repository ({filteredDocs.length})
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Archived medical records and diagnostic files</p>
              </div>
              <input
                type="text"
                placeholder="Filter by file or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition w-full sm:w-60"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">File Details</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Uploaded</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                        Loading repository...
                      </td>
                    </tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No documents stored in vault yet.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{doc.originalName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {(doc.fileSize / 1024).toFixed(1)} KB • {doc.mimeType}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                            {doc.documentType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-semibold">
                          {doc.patient?.fullName || 'General Clinical'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <a
                            href={
                              doc.fileUrl?.startsWith('http')
                                ? doc.fileUrl
                                : `https://drbloomedi-backend.onrender.com/documents/download/${doc.fileName}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                          >
                            👁️ View / Download
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}