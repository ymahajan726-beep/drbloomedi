export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Hospital reports and analytics.
        </p>
      </header>

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="rounded-lg border p-10 text-center">
            <p className="text-sm text-gray-500">
              No reports available.
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Reports will be generated from backend data.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}