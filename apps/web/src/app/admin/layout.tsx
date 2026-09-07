'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { performLogout } from '@/utils/logout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const savedRole = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();
    const savedEmail = localStorage.getItem('userEmail') || '';

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

    if (savedRole === 'RECEPTION') {
      const adminOnlyRoutes = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/roles',
        '/admin/reports',
        '/admin/departments',
        '/admin/doctors',
        '/admin/reception',
        '/admin/billing',
        '/admin/billing/new',
        '/admin/pharmacy',
        '/admin/lab',
        '/admin/emr',
        '/admin/ipd',
        '/admin/documents',
      ];
      if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
        window.location.href = '/reception/dashboard';
        return;
      }
    }

    setIsAuthorized(true);
  }, [pathname]);

  const handleLogout = () => {
    performLogout();
  };

  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  const isReception = role === 'RECEPTION';

  // 4 Logical Groups me Sidebar Structure
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

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden">
      {/* Grouped Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 z-20 border-r border-slate-800">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-white font-black text-xl tracking-tight">
              <span className="text-blue-500">DrBloo</span>Medi
            </div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              {role === 'ADMIN' ? 'Hospital Administration' : `${role} Desk`}
            </p>
          </div>

          {/* Navigation with Category Headings */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto pr-2">
            {isReception && (
              <Link
                href="/reception/dashboard"
                className="flex items-center gap-3 px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-600/30 transition"
              >
                <span>⬅️</span> Back to Front Desk
              </Link>
            )}

            {menuGroups.map((group) => {
              if (isReception && group.adminOnly) return null;

              return (
                <div key={group.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {group.title}
                  </p>

                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      if (isReception && item.adminOnly) return null;
                      const isActive =
                        item.href === '/admin/dashboard'
                          ? pathname === item.href
                          : pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm font-bold'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Clean User Card (No redundant logout button) */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {email ? email.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Logged In</p>
                <p className="text-xs text-slate-300 font-semibold truncate">{email || 'admin@drbloomedi.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace with Single Top Header Logout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Workspace:</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
              {role || 'ADMIN'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition shadow-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}