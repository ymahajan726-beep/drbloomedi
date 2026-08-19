export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage DrblooMedi system settings.
        </p>
      </header>

      <section className="p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <SettingRow
              title="Hospital Information"
              description="Manage hospital profile information."
            />

            <SettingRow
              title="System Configuration"
              description="Manage application configuration."
            />

            <SettingRow
              title="Notification Settings"
              description="Manage system notifications."
            />

            <SettingRow
              title="Security Settings"
              description="Manage security configuration."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function SettingRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-5">
      <h2 className="font-medium text-gray-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}