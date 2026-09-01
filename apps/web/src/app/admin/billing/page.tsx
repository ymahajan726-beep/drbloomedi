export default function BillingPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Billing
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage hospital billing and payments.
        </p>
      </header>

      <section className="p-8">
        <div className="grid gap-5 md:grid-cols-3">
          <BillingCard title="Consultation Charges" />
          <BillingCard title="Lab Charges" />
          <BillingCard title="Pharmacy Billing" />
          <BillingCard title="GST Invoice" />
          <BillingCard title="Online Payments" />
          <BillingCard title="Refund Management" />
        </div>
      </section>
    </main>
  );
}

function BillingCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900">
        {title}
      </h2>

      <p className="mt-3 text-sm text-gray-500">
        Data and transactions will be loaded from the backend.
      </p>
    </div>
  );
}