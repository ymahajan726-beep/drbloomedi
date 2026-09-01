"use client";

import Link from "next/link";

export default function AddPatientPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Add Patient
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a new patient record.
        </p>
      </header>

      <section className="p-8">
        <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <form className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Patient Name
              </label>

              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
                placeholder="Enter patient name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone
              </label>

              <input
                type="text"
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date of Birth
              </label>

              <input
                type="date"
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-50"
              >
                Save Patient
              </button>

              <Link
                href="/admin/patients"
                className="rounded-lg border px-5 py-2 text-sm font-medium text-gray-700"
              >
                Cancel
              </Link>
            </div>

            <p className="text-xs text-gray-400">
              Saving will be enabled after the backend API is connected.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}