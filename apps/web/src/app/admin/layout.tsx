'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { performLogout } from '@/utils/logout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Session Cookie रीड करने का हेल्पर फ़ंक्शन
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const savedRole = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();
    const savedEmail = localStorage.getItem('userEmail') || '';

    // 2. UNAUTHENTICATED GUARD: अगर टोकन या रोल नहीं है, तो तुरंत लॉगिन पर भेजें
    if (!token || !savedRole) {
      window.location.href = '/login';
      return;
    }

    setRole(savedRole);
    setEmail(savedEmail);

    // 3. DOCTOR GUARD: डॉक्टर को एडमिन का कोई भी पेज न देखने दें
    if (savedRole === 'DOCTOR') {
      window.location.href = '/doctor/dashboard';
      return;
    }

    // 4. RECEPTION GUARD: रिसेप्शनिस्ट एडमिन-ओनली पेज खोले तो रिसेप्शन कंसोल पर भेजें
    if (savedRole === 'RECEPTION') {
      const adminOnlyRoutes = [
        '/admin/dashboard',
        '/admin/roles',
        '/admin/reports',
        '/admin/departments',
        '/admin/doctors',
        '/admin/reception',
        '/admin/billing',
        '/admin/billing/new',
        '/admin/pharmacy',
        '/admin/lab',
        '/admin/emr ',
        '/admin/ipd',
        
      ];
      if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
        window.location.href = '/reception/dashboard';
        return;
      }
    }

    // 5. सिर्फ ऑथराइज्ड होने पर ही स्क्रीन लोड होने दें
    setIsAuthorized(true);
  }, [pathname]);

  // Logout फ़ंक्शन
  const handleLogout = () => {
    performLogout();
  };

  // जब तक सेशन वेरिफाई नहीं होता, लोडर दिखाएं ताकि डेटा लीक न हो
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

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between flex-shrink-0 z-20 border-r border-slate-800">
        <div>
          {/* Logo & Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white font-black text-xl tracking-tight">
                <span className="text-blue-500">DrBloo</span>Medi
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {role === 'ADMIN' ? 'Hospital Administration' : `${role} Desk`}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
            {/* रिसेप्शनिस्ट के लिए बैक बटन */}
            {isReception && (
              <Link
                href="/reception/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-600/30 transition"
              >
                <span>⬅️</span> Back to Front Desk
              </Link>
            )}

            {/* केवल ADMIN को दिखने वाले लिंक्स */}
            {!isReception && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin/dashboard'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📊</span> Dashboard
                </Link>

                <Link
                  href="/admin/departments"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin/departments')
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🏢</span> Departments
                </Link>

                <Link
                  href="/admin/doctors"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin/doctors')
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🩺</span> Doctors
                </Link>

                <Link
                  href="/admin/reception"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin/reception')
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🧑‍💼</span> Reception Staff
                </Link>

                <Link
                  href="/admin/reports"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin/reports')
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📈</span> Reports
                </Link>

                <Link
                  href="/admin/roles"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin/roles')
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🛡️</span> User Roles
                </Link>
              </>
            )}

            {/* कॉमन ऑपरेशंस लिंक्स */}
            <Link
              href="/admin/patients"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/admin/patients')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>👥</span> Patients
            </Link>

            <Link
              href="/admin/appointments"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/admin/appointments')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>📅</span> Appointments
            </Link>

            <Link
              href="/admin/billing"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/admin/billing')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>💳</span> Billing & Counter
            </Link>

            {/* Pharmacy & Stock Link */}
            <Link
              href="/admin/pharmacy"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/admin/pharmacy')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>💊</span> Pharmacy & Stock
            </Link>
            {/* Pathology & Lab Link */}
            <Link
              href="/admin/lab"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/admin/lab')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🔬</span> Pathology & Lab
            </Link>
            {/* Patient 360 EMR Link */}
            <Link
              href="/admin/emr"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/admin/emr')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>📁</span> Patient 360° EMR
            </Link>
            {/* IPD & Bed Management Link */}
            <Link
              href="/admin/ipd"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/admin/ipd')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>🛏️</span> IPD & Wards
            </Link>
          </nav>
        </div>

        {/* Global Sidebar Logout Footbar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="mb-2 px-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Logged In</p>
            <p className="text-xs text-slate-300 font-semibold truncate">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace with Top Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Workspace:</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
              {role || 'ADMIN'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}