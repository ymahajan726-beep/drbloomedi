'use client';

import React, { useState, useEffect } from 'react';

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload Form State
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
      alert('Please select a document or scan file to upload');
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

      // Reset form
      setSelectedFile(null);
      setRemarks('');
      alert('Medical Document Uploaded Successfully!');
    } catch (err: any) {
      alert(`Upload Error: ${err.message}`);
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full uppercase">
            Clinical EMR • Document Vault
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Medical Records & Report Storage</h1>
          <p className="text-xs text-slate-500">
            Securely upload, archive, and view diagnostic scans, lab PDFs, and medical records
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold self-start md:self-auto"
        >
          🔄 Refresh Vault
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Upload New Clinical Document
          </h2>

          <form onSubmit={handleUpload} className="space-y-3 text-xs">
            {/* Patient Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Attach to Patient (Optional)
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Document Category *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
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
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Select File (PDF, PNG, JPG) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Clinical Remarks / Doctor Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Chest X-ray clear, verified by radiologist"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition"
            >
              {uploading ? 'Archiving & Uploading...' : '📁 Upload to Clinical Storage'}
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Archived Documents List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Document Repository ({filteredDocs.length})
              </h2>
              <p className="text-[11px] text-slate-400">Archived medical records and diagnostic files</p>
            </div>
            <input
              type="text"
              placeholder="Filter by file or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none w-full sm:w-60"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">File Details</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Patient</th>
                  <th className="py-2.5">Uploaded</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading repository...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No documents stored in vault yet.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition">
                      <td className="py-3">
                        <p className="font-bold text-slate-900 truncate max-w-xs">{doc.originalName}</p>
                        <p className="text-[10px] text-slate-400">
                          {(doc.fileSize / 1024).toFixed(1)} KB • {doc.mimeType}
                        </p>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 font-semibold">
                        {doc.patient?.fullName || 'General Clinical'}
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <a
                            href={
                                doc.fileUrl?.startsWith('http')
                                ? doc.fileUrl
                                : `https://drbloomedi-backend.onrender.com/documents/download/${doc.fileName}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition"
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
    </div>
  );
}