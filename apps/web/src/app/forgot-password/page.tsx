'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('https://drbloomedi-backend.onrender.com/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request security code');

      const generatedToken = data.token ? String(data.token).trim() : '';
      setToken(generatedToken);

      setSuccessMsg('Verification code sent and auto-filled successfully!');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!token.trim()) {
      setError('Verification code is missing.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://drbloomedi-backend.onrender.com/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });

      setSuccessMsg('Password updated successfully! All sessions secured. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  const field =
    'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Password Recovery</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {step === 1
              ? 'Enter your registered email address to receive recovery verification'
              : 'Enter your verification code and set a secure new password'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg font-semibold">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-lg font-semibold">
            ✓ {successMsg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                Registered Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your mail"
                className={field}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Request Security Code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">
                  Security Verification Code *
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                  ✓ Auto-filled
                </span>
              </div>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter security code"
                className="w-full p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-mono tracking-widest font-bold text-center outline-none focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 pr-14 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 px-3.5 flex items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full p-2.5 pr-14 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-3.5 flex items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Securing...' : 'Update Password →'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link href="/login" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            ← Back to Login Portal
          </Link>
        </div>
      </div>
    </div>
  );
}