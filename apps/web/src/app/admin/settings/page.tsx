'use client';

import React from 'react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            SET
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              System Settings
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage DrBlooMedi system configurations and hospital profiles.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6">
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
      </main>
    </div>
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
    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 transition">
      <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
        {description}
      </p>
    </div>
  );
}