
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    user,
    loading,
    logout,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/login");
    }
  }, [
    user,
    loading,
    router,
  ]);

  async function handleLogout() {
    await logout();

    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (
    !user ||
    user.role !== "ADMIN"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 border-r bg-white">
        <div className="border-b p-6">
          <h1 className="text-xl font-bold text-gray-900">
            DrblooMedi
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Admin Panel
          </p>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/departments"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Departments
            </Link>

            <Link
              href="/admin/doctors"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Doctors
            </Link>

            <Link
              href="/admin/patients"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Patients
            </Link>

            <Link
              href="/admin/reception"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Reception Staff
            </Link>

            <Link
              href="/admin/billing"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Billing
            </Link>

            <Link
              href="/admin/reports"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Reports
            </Link>

            <Link
              href="/admin/roles"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              User Roles & Permissions
            </Link>
            <Link
              href="/admin/users"
              className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Users
            </Link>
          </div>

          <div className="mt-6 border-t pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

