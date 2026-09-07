'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('admin123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      const role = data.user?.role || 'ADMIN';
      const token = data.accessToken || 'session_token';

      // LocalStorage Update
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', data.user?.email || email);

      // Middleware Cookies Update (Valid for 24 Hours)
      document.cookie = `token=${token}; path=/; SameSite=Lax`;
      document.cookie = `userRole=${role}; path=/; SameSite=Lax`;

      // Smart Redirection
      if (role === 'RECEPTION') {
        router.push('/reception/dashboard');
      } else if (role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else if (role === 'PATIENT') {
        router.push('/patient/portal');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10">
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-8 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[11px] font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>v2.4 Security Active</span>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                Healthcare Management Reimagined.
              </h2>
              <p className="text-xs text-blue-100/80 mt-2 leading-relaxed">
                Centralized hospital orchestration for clinical OPD, counter billing, patient telemetry, and doctor workflows.
              </p>
            </div>
          </div>

          <div className="my-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 relative z-10">
            <div className="flex items-center justify-between text-[11px] text-blue-100 mb-2">
              <span className="font-semibold">Live System Telemetry</span>
              <span className="text-emerald-300 font-bold">99.9% Uptime</span>
            </div>
            <svg
              className="w-full h-12 text-blue-200"
              viewBox="0 0 300 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M0 30 H70 L80 15 L90 45 L105 5 L120 50 L130 25 L140 30 H300"
              />
            </svg>
          </div>

          <div className="relative z-10 text-[11px] text-blue-200/70 flex items-center gap-2">
            <span>🔒</span>
            <span>256-Bit SSL Encrypted Healthcare Portal</span>
          </div>
        </div>

        <div className="col-span-12 md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="text-center md:text-left mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 mb-3 transform hover:scale-105 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Dr<span className="text-blue-600">Bloo</span>Medi
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Enter your credentials to access your designated workspace
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Staff Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  ✉️
                </span>
                <input
                  type="email"
                  required
                  placeholder="admin@drbloomedi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
                >
                  Forgot?
                </Link>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  🔑
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Portal →</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 text-center md:text-left">
              Quick Test Autofill:
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@drbloomedi.com')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-[11px] font-semibold text-slate-600 transition"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('doctor@gmail.com')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-[11px] font-semibold text-slate-600 transition"
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('reception@drbloomedi.com')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-[11px] font-semibold text-slate-600 transition"
              >
                🧑‍💼 Reception
              </button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
            
              
              {/* Patient Portal Card/Button */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
              {/* Patient Portal Card/Button */}
              <Link
                href="/patient-portal"
                className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-center transition flex flex-col items-center justify-center gap-0.5 group"
              >
                <span className="text-base group-hover:scale-105 transition">🧑‍⚕️</span>
                <span className="text-[11px] font-bold text-blue-800 leading-tight">Patient Portal</span>
                <span className="text-[9px] text-blue-500 font-medium leading-none">OTP / Quick Access</span>
              </Link>
            </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}