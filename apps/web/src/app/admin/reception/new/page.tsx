import Link from "next/link";

export default function AddReceptionPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Add Reception Staff
        </h1>
      </header>

      <section className="p-8">
        <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <form className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>

              <input
                type="text"
                placeholder="Enter staff name"
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter email"
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone
              </label>

              <input
                type="text"
                placeholder="Enter phone number"
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled
                className="rounded-lg bg-blue-600 px-5 py-2 text-white opacity-50"
              >
                Save Staff
              </button>

              <Link
                href="/admin/reception"
                className="rounded-lg border px-5 py-2 text-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}