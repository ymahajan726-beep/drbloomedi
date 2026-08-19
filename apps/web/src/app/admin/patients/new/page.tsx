"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Patient name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("http://localhost:4000/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dob, phone }),
      });

      if (!response.ok) throw new Error("Failed to create patient");

      // after successful creation navigate back to patients list
      router.push("/admin/patients");
    } catch (err) {
      setError("Unable to save patient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Add Patient</h1>
      </header>

      <section className="p-8">
        <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient full name" className="w-full rounded-lg border px-4 py-2 text-gray-900" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-gray-900" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-lg border px-4 py-2 text-gray-900" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50">
                {saving ? "Saving..." : "Save Patient"}
              </button>

              <button type="button" onClick={() => router.back()} className="rounded-lg border px-5 py-2 text-gray-700">Cancel</button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
