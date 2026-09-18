"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://drbloomedi-backend.onrender.com";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed.");
      }

      setMessage("Password updated successfully! Redirecting to login...");
      setToken("");
      setNewPassword("");
      setConfirmPassword("");

      // Smooth auto-redirect after success
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  const field =
    'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
      {/* HEADER */}
      <div className="text-center space-y-1">
        <h1 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">Reset Password</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
          Set a secure new password for your account
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3.5 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          ✓ {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-3.5 py-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* TOKEN */}
        <div>
          <label className="mb-1.5 block font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">
            Reset Token *
          </label>
          <input
            type="text"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Enter reset token"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition text-xs"
          />
        </div>

        {/* NEW PASSWORD */}
        <div>
          <label className="mb-1.5 block font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">
            New Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 pr-14 font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <label className="mb-1.5 block font-semibold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-400">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter new password"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 pr-14 font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition text-xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-2xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-xs"
        >
          {loading ? "Updating Password..." : "Reset Password →"}
        </button>
      </form>

      {/* LOGIN LINK */}
      <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-3">
        <Link
          href="/login"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <Suspense
        fallback={
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse font-mono">
            Loading secure form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}