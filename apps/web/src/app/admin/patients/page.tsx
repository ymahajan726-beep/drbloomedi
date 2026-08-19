"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Patient = {
  id: number;
  name: string;
  dob?: string;
  phone?: string;
};

const API_URL = "http://localhost:4000/patients";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch patients");
        return res.json();
      })
      .then((data: Patient[]) => setPatients(data))
      .catch(() => setError("Unable to connect to backend."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Patients</h1>
            <p className="mt-1 text-sm text-gray-500">Patient records will be loaded from the backend API.</p>
          </div>

          <Link href="/admin/patients/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add Patient</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading patients...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-gray-500">No patients found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">DOB</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="px-4 py-4 text-sm text-gray-600">{p.id}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{p.dob || "-"}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{p.phone || "-"}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <Link href={`/admin/patients/${p.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View</Link>
                          <Link href={`/admin/patients/${p.id}/edit`} className="text-sm font-medium text-gray-700 hover:text-gray-900">Edit</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
