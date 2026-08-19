"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Doctor = {
  id: number;
  name: string;
  specialization?: string;
  isActive: boolean;
};

const API_URL = "http://localhost:4000/doctors";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch doctors");
        return res.json();
      })
      .then((data: Doctor[]) => setDoctors(data))
      .catch(() => setError("Unable to connect to backend."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
            <p className="mt-1 text-sm text-gray-500">
              Doctors will be loaded from the backend API.
            </p>
          </div>

          <Link
            href="/admin/doctors/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Doctor
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading doctors...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-gray-500">No doctors found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Specialization</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id} className="border-b last:border-b-0">
                      <td className="px-4 py-4 text-sm text-gray-600">{d.id}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{d.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{d.specialization || "-"}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <Link href={`/admin/doctors/${d.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View</Link>
                          <Link href={`/admin/doctors/${d.id}/edit`} className="text-sm font-medium text-gray-700 hover:text-gray-900">Edit</Link>
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
