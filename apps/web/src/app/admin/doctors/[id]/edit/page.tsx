"use client";

import { FormEvent, useEffect, useState } from "react";
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

type Department = { id: number; name: string };

export default function EditDoctorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [specialization, setSpecialization] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`http://localhost:4000/doctors/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("http://localhost:4000/departments").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([doc, deps]) => {
        if (doc) {
          setDoctor(doc);
          setSpecialization(doc.specialization || "");
          setQualifications(doc.qualifications || "");
          setDepartmentId(doc.department?.id ?? "");
          setPhone(doc.phone || "");
          setIsActive(doc.isActive);
        }

        setDepartments(deps || []);
      })
      .catch(() => setError("Unable to load data"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:4000/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialization,
          qualifications,
          departmentId: departmentId === "" ? undefined : Number(departmentId),
          phone,
          isActive,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      router.push(`/admin/doctors/${id}`);
    } catch (err: any) {
      setError(err?.message || "Unable to update doctor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Edit Doctor</h1>
      </header>

      <section className="p-8">
        <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : !doctor ? (
            <p className="text-sm text-gray-500">Doctor not found.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Doctor Details</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Specialization</label>
                    <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Qualifications</label>
                    <input value={qualifications} onChange={(e) => setQualifications(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Department</label>
                    <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-lg border px-4 py-2">
                      <option value="">Select department (optional)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    <label htmlFor="active" className="text-sm text-gray-700">Active</label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={() => router.back()} className="rounded-lg border px-5 py-2 text-gray-700">Cancel</button>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
