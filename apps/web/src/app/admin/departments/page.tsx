"use client";

import { FormEvent, useEffect, useState } from "react";

type Department = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
};

const API_URL = "http://localhost:4000/departments";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadDepartments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load departments");
      }

      const data = await response.json();
      setDepartments(data);
    } catch {
      setError("Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!name.trim()) {
    setError("Department name is required.");
    return;
  }

  try {
    setSaving(true);
    setError("");

    const url = editingId
      ? `${API_URL}/${editingId}`
      : API_URL;

    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save department");
    }

    setName("");
    setDescription("");
    setEditingId(null);

    await loadDepartments();
  } catch {
    setError("Unable to save department.");
  } finally {
    setSaving(false);
  }
}
function handleEdit(department: Department) {
  setEditingId(department.id);
  setName(department.name);
  setDescription(department.description || "");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
function handleCancelEdit() {
  setEditingId(null);
  setName("");
  setDescription("");
  setError("");
}
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this department?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete department");
      }

      await loadDepartments();
    } catch {
      setError("Unable to delete department.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Departments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage hospital departments.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Add Department */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Department
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Department Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Example: Cardiology"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Department description"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
              {saving
                    ? "Saving..."
                    : editingId
                        ? "Update Department"
                : "Add Department"}
              </button>
              {editingId && (
            <button
                type="button"
                onClick={handleCancelEdit}
                className="ml-3 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
                Cancel
            </button>
            )}
            </div>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Department List */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Department List
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Total departments: {departments.length}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-gray-500">
              Loading departments...
            </p>
          ) : departments.length === 0 ? (
            <p className="mt-6 text-sm text-black-500">
              No departments found.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {departments.map((department) => (
                    <tr
                      key={department.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {department.id}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {department.name}
                      </td>

                      <td className="px-4 py-4 text-sm text-black-500">
                        {department.description || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            department.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {department.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                <button
                    onClick={() => handleEdit(department)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    Edit
                </button>

                <button
                    onClick={() => handleDelete(department.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                    Delete
                </button>
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