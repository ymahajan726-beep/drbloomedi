"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Doctor = {
  id: number;
  specialization?: string;
  qualifications?: string;
  phone?: string;
  isActive: boolean;
  user: { id: number; name: string; email: string };
  department?: { id: number; name: string };
};

export default function DoctorViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = params;

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4000/doctors/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch doctor");
        return res.json();
      })
      .then((data) => setDoctor(data))
      .catch(() => setError("Unable to load doctor."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this doctor?");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:4000/doctors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/doctors");
    } catch (err) {
      alert("Unable to delete doctor.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Details</h1>
            <p className="mt-1 text-sm text-gray-500">Details for doctor ID: {id}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => router.push(`/admin/doctors/${id}/edit`)} className="rounded-lg border px-4 py-2">Edit</button>
            <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-white">Delete</button>
          </div>
        </div>
      </header>

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : doctor ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Account</h2>
                <p className="text-sm text-gray-700">Name: {doctor.user.name}</p>
                <p className="text-sm text-gray-700">Email: {doctor.user.email}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900">Professional</h2>
                <p className="text-sm text-gray-700">Specialization: {doctor.specialization || "-"}</p>
                <p className="text-sm text-gray-700">Qualifications: {doctor.qualifications || "-"}</p>
                <p className="text-sm text-gray-700">Department: {doctor.department?.name || "-"}</p>
                <p className="text-sm text-gray-700">Phone: {doctor.phone || "-"}</p>
                <p className="text-sm text-gray-700">Status: {doctor.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Doctor not found.</p>
          )}
        </div>
      </section>
    </main>
  );
}
