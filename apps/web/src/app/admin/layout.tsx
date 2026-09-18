'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { performLogout } from '@/utils/logout';
import { ToastProvider } from '@/components/Toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const token = sessionStorage.getItem('token');
    const savedRole =
      sessionStorage.getItem('userRole')?.toUpperCase() || null;
    const savedEmail = sessionStorage.getItem('userEmail') || '';

    if (!token || !savedRole) {
      window.location.href = '/login';
      return;
    }

    setRole(savedRole);
    setEmail(savedEmail);

    if (savedRole === 'DOCTOR') {
      window.location.href = '/doctor/dashboard';
      return;
    }

      if (savedRole === 'RECEPTION' || savedRole === 'RECEPTIONIST') {
        window.location.href = '/reception/dashboard';
        return;
      }

    if (savedRole !== 'ADMIN') {
      window.location.href = '/login';
      return;
    }

   setIsAuthorized(true);
  }, [pathname]);

  const handleLogout = () => {
    performLogout('Logged out successfully.');
  };
  if (!isMounted || !isAuthorized) {
    return (
      <div suppressHydrationWarning className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase font-mono">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  const isReception = role === 'RECEPTION';

  const menuGroups = [
    {
      title: 'OVERVIEW',
      adminOnly: true,
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      ],
    },
    {
      title: 'CLINICAL OPERATIONS',
      adminOnly: false,
      items: [
        { name: 'Doctor OPD Cabin', href: '/admin/doctors', icon: '🩺', adminOnly: true },
        { name: 'Reception & Queue', href: '/admin/reception', icon: '🧑‍💼', adminOnly: true },
        { name: 'Appointments', href: '/admin/appointments', icon: '📅', adminOnly: false },
        { name: 'Patient Directory', href: '/admin/patients', icon: '👥', adminOnly: false },
        { name: 'Patient 360° EMR', href: '/admin/emr', icon: '📋', adminOnly: false },
      ],
    },
    {
      title: 'DIAGNOSTICS & IPD',
      adminOnly: false,
      items: [
        { name: 'Pharmacy & Stock', href: '/admin/pharmacy', icon: '💊', adminOnly: false },
        { name: 'Pathology & Lab', href: '/admin/lab', icon: '🔬', adminOnly: false },
        { name: 'IPD & Bed Wards', href: '/admin/ipd', icon: '🛏️', adminOnly: false },
        { name: 'Document Vault', href: '/admin/documents', icon: '📁', adminOnly: true },
      ],
    },
    {
      title: 'ADMIN & FINANCE',
      adminOnly: true,
      items: [
        { name: 'Staff & Personnel', href: '/admin/users', icon: '🛡️', adminOnly: true },
        { name: 'Billing Desk', href: '/admin/billing', icon: '💳', adminOnly: false },
        { name: 'Wings / Depts', href: '/admin/departments', icon: '🏢', adminOnly: true },
        { name: 'Reports & Audit', href: '/admin/reports', icon: '📈', adminOnly: true },
      ],
    },
  ];

  const sidebarContent = (mobileDrawer = false) => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
        <div className="w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white font-bold text-base tracking-tight">
            <span className={`${mobileDrawer ? 'hidden' : 'md:hidden'} text-emerald-600`}>D</span>
            <span className={mobileDrawer ? '' : 'hidden md:inline'}>
              DrBloo<span className="text-emerald-600 dark:text-emerald-400">Medi</span>
            </span>
          </div>
          <p className={`${mobileDrawer ? 'block' : 'hidden md:block'} text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5`}>
            {role === 'ADMIN' ? 'Hospital Administration' : `${role} Desk`}
          </p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className={`${mobileDrawer ? '' : 'md:hidden'} text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 text-sm font-bold cursor-pointer`}
        >
          ✕
        </button>
      </div>


      <nav className="flex-1 p-3 space-y-4 overflow-y-auto pr-2">
        {isReception && (
          <Link
            href="/reception/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            title="Back to Front Desk"
            aria-label="Back to Front Desk"
            className="flex items-center justify-center md:justify-start gap-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs font-semibold transition"
          >
            <span>⬅️</span>
            <span className={mobileDrawer ? 'inline' : 'hidden md:inline'}>Back to Front Desk</span>
          </Link>
        )}

        {menuGroups.map((group) => {
          if (isReception && group.adminOnly) return null;

          return (
            <div key={group.title} className="space-y-1">
              <p className={`${mobileDrawer ? 'block' : 'hidden md:block'} px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400`}>
                {group.title}
              </p>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  if (isReception && (item as any).adminOnly) return null;
                  const isActive =
                    item.href === '/admin/dashboard'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      title={item.name}
                      aria-label={item.name}
                      className={`flex items-center ${mobileDrawer ? 'justify-start px-3' : 'justify-center md:justify-start px-3'} gap-2.5 py-2 rounded-lg text-xs font-semibold transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className={mobileDrawer ? 'inline truncate' : 'hidden md:inline truncate'}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
        <div className={`flex items-center ${mobileDrawer ? 'justify-start' : 'justify-center md:justify-start'} gap-2.5 px-1`}>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
            {email ? email.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className={`${mobileDrawer ? 'block' : 'hidden md:block'} overflow-hidden`}>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Logged In</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold truncate font-mono">{email || 'admin@drbloomedi.com'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div suppressHydrationWarning className="h-screen w-screen flex flex-col md:flex-row bg-[#F4F7F6] dark:bg-slate-950 font-sans antialiased overflow-hidden">
        <aside className="hidden md:flex w-64 lg:w-72 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex-col justify-between shrink-0 z-20 border-r border-slate-200 dark:border-slate-800 h-full">
          {sidebarContent()}
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" suppressHydrationWarning>
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex flex-col justify-between z-10 h-full border-r border-slate-200 dark:border-slate-800 shadow-2xl">
              {sidebarContent(true)}
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden" suppressHydrationWarning>
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shrink-0 z-10 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition font-semibold text-xs cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                ☰ Menu
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider hidden sm:inline">Workspace:</span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 rounded-md font-mono">
                  {role || 'ADMIN'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </header>
  
          <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto box-border">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}