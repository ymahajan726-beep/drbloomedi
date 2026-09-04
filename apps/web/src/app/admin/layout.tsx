'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') || 'ADMIN';
    const savedEmail = localStorage.getItem('userEmail') || '';
    setRole(savedRole);
    setEmail(savedEmail);

    // 1. DOCTOR GUARD: अगर डॉक्टर है और वो /admin वाले किसी भी पेज पर आया, तो तुरंत डॉक्टर कंसोल पर भेजो
    if (savedRole === 'DOCTOR') {
      router.replace('/doctor/dashboard');
      return;
    }

    // 2. RECEPTION GUARD: अगर रिसेप्शनिस्ट एडमिन-ओनली पेज खोलने की कोशिश करे तो रिसेप्शन डेस्क पर भेजो
    if (savedRole === 'RECEPTION') {
      const adminOnlyRoutes = [
        '/admin/dashboard',
        '/admin/roles',
        '/admin/reports',
        '/admin/departments',
        '/admin/doctors',
        '/admin/reception',
      ];
      if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
        router.replace('/reception/dashboard');
        return;
      }
    }

    setIsChecking(false);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // जब तक रोल चेक हो रहा है या डॉक्टर रीडायरेक्ट हो रहा है, तब तक एडमिन स्क्रीन न दिखाएं
  if (isChecking && role === 'DOCTOR') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="text-center space-y-2">
          <div className="text-2xl animate-spin">🩺</div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Redirecting to Doctor Clinical Console...
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
            {/* रिसेप्शनिस्ट के लिए खास बैक बटन */}
            {isReception && (
              <Link
                href="/reception/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold hover:bg-blue-600/30 transition"
              >
                <span>⬅️</span> Back to Front Desk
              </Link>
            )}

            {/* केवल ADMIN को दिखने वाले संवेदनशील लिंक्स */}
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
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl transition duration-150"
          >
            <span>🚪</span> Sign Out
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