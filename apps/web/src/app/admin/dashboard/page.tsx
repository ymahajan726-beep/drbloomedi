"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Department = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
};

const stats = [
  {
    title: "Total Doctors",
    value: 24,
    description: "Registered doctors",
  },
  {
    title: "Total Patients",
    value: 186,
    description: "Registered patients",
  },
  {
    title: "Reception Staff",
    value: 12,
    description: "Active staff members",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/login");
    }
  };

  // Load departments
  useEffect(() => {
    fetch("http://localhost:4000/departments")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch departments");
        }

        return response.json();
      })
      .then((data: Department[]) => {
        setDepartments(data);
      })
      .catch(() => {
        setError("Unable to connect to backend");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
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

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome, Admin 👋
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Manage doctors, patients, reception staff and departments.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">
                {stat.title}
              </p>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {stat.description}
              </p>
            </div>
          ))}

          {/* Departments */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Departments
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {loading ? "..." : departments.length}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Active hospital departments
            </p>
          </div>
        </div>

        {/* Department List */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Departments
          </h2>

          {/* Loading */}
          {loading && (
            <p className="mt-4 text-sm text-gray-500">
              Loading departments...
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Empty */}
          {!loading && !error && departments.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">
              No departments found.
            </p>
          )}

          {/* Department List */}
          {!loading && !error && departments.length > 0 && (
            <div className="mt-4 space-y-3">
              {departments.map((department) => (
                <div
                  key={department.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {department.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {department.description}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      department.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {department.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}