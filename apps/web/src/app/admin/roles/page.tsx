"use client";

import { useEffect, useState } from "react";

type Role = {
  id: number;
  name: string;
  description?: string;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("http://localhost:4000/roles")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch roles");
        return res.json();
      })
      .then((data: Role[]) => setRoles(data))
      .catch(() => setError("Unable to connect to backend."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">User Roles & Permissions</h1>
        <p className="mt-1 text-sm text-gray-500">Manage application roles and permissions.</p>
      </header>

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading roles...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-500">No roles found.</p>
          ) : (
            <div className="space-y-3">
              {roles.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <h3 className="font-medium text-gray-900">{r.name}</h3>
                  <p className="text-sm text-gray-500">{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
