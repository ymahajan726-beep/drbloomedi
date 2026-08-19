"use client";

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage billing, invoices and transactions.</p>
      </header>

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="rounded-lg border p-10 text-center">
            <p className="text-sm text-gray-500">No billing records found.</p>
            <p className="mt-1 text-xs text-gray-400">Billing data will be loaded from the backend APIs.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
