
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DoctorUser = {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
};

type Doctor = {
  id: number;
  user: DoctorUser;
  specialization?: string | null;
  qualifications?: string | null;
  phone?: string | null;
  isActive: boolean;
};

const API_URL = "http://localhost:4000";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD DOCTORS
  // =====================================================

  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/doctors`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            setError(
              "You are not authorized to view doctors.",
            );

            return;
          }

          throw new Error(
            "Failed to fetch doctors",
          );
        }

        const data =
          await response.json();

        setDoctors(data);
      } catch (error) {
        console.error(
          "Doctors loading failed:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to connect to backend.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDoctors();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b bg-white px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Doctors
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage all registered doctors.
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

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* DOCTORS TABLE */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          {loading ? (
            <div className="p-6">
              <p className="text-sm text-gray-500">
                Loading doctors...
              </p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-gray-500">
                No doctors found.
              </p>

              <Link
                href="/admin/doctors/new"
                className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Add your first doctor
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                {/* TABLE HEADER */}

                <thead className="border-b bg-gray-50">

                  <tr className="text-sm text-gray-500">

                    <th className="px-6 py-4 font-medium">
                      ID
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Email
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Specialization
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Qualifications
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Phone
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Action
                    </th>

                  </tr>

                </thead>

                {/* TABLE BODY */}

                <tbody>

                  {doctors.map(
                    (doctor) => (
                      <tr
                        key={doctor.id}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >

                        {/* ID */}

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {doctor.id}
                        </td>

                        {/* EMAIL */}

                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {doctor.user?.email || "-"}
                        </td>

                        {/* SPECIALIZATION */}

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {doctor.specialization || "-"}
                        </td>

                        {/* QUALIFICATIONS */}

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {doctor.qualifications || "-"}
                        </td>

                        {/* PHONE */}

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {doctor.phone || "-"}
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              doctor.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {doctor.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-4">

                          <div className="flex gap-4">

                            <Link
                              href={`/admin/doctors/${doctor.id}/edit`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </Link>

                          </div>

                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}

