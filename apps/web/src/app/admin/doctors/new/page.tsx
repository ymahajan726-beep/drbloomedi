"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Department = { id: number; name: string };

export default function NewDoctorPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [specialization, setSpecialization] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingDeps(true);
    fetch("http://localhost:4000/departments")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDepartments(data))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDeps(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email and password are required for user creation.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. Create User
      const createUserRes = await fetch("http://localhost:4000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!createUserRes.ok) {
        const txt = await createUserRes.text();
        throw new Error(`Failed to create user: ${txt}`);
      }

      const createdUser = await createUserRes.json();

      // 2. Create Doctor
      const createDoctorRes = await fetch("http://localhost:4000/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createdUser.id,
          specialization,
          qualifications,
          departmentId: departmentId === "" ? undefined : Number(departmentId),
          phone,
          isActive,
        }),
      });

      if (!createDoctorRes.ok) {
        const txt = await createDoctorRes.text();
        throw new Error(`Failed to create doctor: ${txt}`);
      }

      // success
      router.push("/admin/doctors");
    } catch (err: any) {
      setError(err?.message || "Unable to create doctor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Add Doctor</h1>
      </header>

      <section className="p-8">
        <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">User (Account)</h2>
              <p className="text-sm text-gray-500">A user account will be created for the doctor.</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Full name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-4 py-2" />
                </div>
              </div>
            </div>

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
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50">
                {saving ? "Saving..." : "Create Doctor"}
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