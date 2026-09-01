
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardStats = {
  totalDoctors: number;
  totalPatients: number;
  totalReception: number;
};

const API_URL = "http://localhost:4000";

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD ADMIN DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/dashboard/admin`,
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
            router.replace("/login");
            return;
          }

          throw new Error(
            "Failed to load dashboard",
          );
        }

        const data =
          await response.json();

        setStats(data);
      } catch (error) {
        console.error(
          "Dashboard loading failed:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to connect to backend",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await fetch(
        `${API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );
    } finally {
      router.replace("/login");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              DrblooMedi Hospital Management System
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>

        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================================
            WELCOME
        ================================================= */}

        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Welcome, Admin 👋
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Manage doctors, patients and reception staff.
          </p>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* =================================================
              TOTAL DOCTORS
          ================================================= */}

          <div className="rounded-xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Total Doctors
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {loading
                ? "..."
                : stats?.totalDoctors ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Registered doctors
            </p>

          </div>

          {/* =================================================
              TOTAL PATIENTS
          ================================================= */}

          <div className="rounded-xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Total Patients
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {loading
                ? "..."
                : stats?.totalPatients ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Registered patients
            </p>

          </div>

          {/* =================================================
              RECEPTION STAFF
          ================================================= */}

          <div className="rounded-xl bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Reception Staff
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {loading
                ? "..."
                : stats?.totalReception ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Registered reception staff
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}

