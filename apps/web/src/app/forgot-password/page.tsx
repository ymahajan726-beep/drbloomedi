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

  // Show / Hide Password Toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Request Security Code and Auto-fill
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
      if (!res.ok) {
        throw new Error(data.message || 'Failed to request security code');
      }

      // Auto-fill code from response
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

  // Step 2: Set New Password & Handle Invalidation (Point 10 requirement)
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
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      // Invalidate active sessions locally as requested in Point 10
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-slate-900">Password Recovery</h1>
          <p className="text-xs text-slate-400">
            {step === 1
              ? 'Enter your registered email address to receive recovery verification'
              : 'Enter your verification code and set a secure new password'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl font-medium">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl font-medium">
            ✅ {successMsg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your mail"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Forget Password →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            {/* Auto-filled Security Code */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-400">
                  Security Verification Code
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ✓ Auto-filled
                </span>
              </div>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter security code"
                className="w-full px-3.5 py-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 outline-none focus:border-emerald-500 font-mono tracking-widest font-semibold text-center"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-3.5 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 px-3.5 flex items-center text-[11px] font-bold text-slate-400 hover:text-slate-900"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-3.5 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-3.5 flex items-center text-[11px] font-bold text-slate-400 hover:text-slate-900"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-750 text-slate-600 font-bold rounded-xl transition border border-slate-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {loading ? 'Securing...' : 'Update Password →'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="text-xs font-bold text-blue-400 hover:underline">
            ← Back to Login Portal
          </Link>
        </div>
      </div>
    </div>
  );
}