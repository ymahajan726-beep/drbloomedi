"use client";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          DrblooMedi Hospital Management System
        </p>
      </header>

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome, Admin 👋
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Welcome to the DrblooMedi Admin Panel.
          </p>
        </div>
      </section>
    </main>
  );
}