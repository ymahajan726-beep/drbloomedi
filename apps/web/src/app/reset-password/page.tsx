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

  return (
    <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-8 shadow-xl">
      {/* HEADER */}
      <div className="mb-6 text-center space-y-1">
        <h1 className="text-xl font-black text-slate-900">Reset Password</h1>
        <p className="text-xs text-slate-500">
          Set a secure new password for your account
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700">
          ✓ {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* TOKEN */}
        <div>
          <label className="mb-1.5 block font-bold uppercase tracking-wider text-[10px] text-slate-500">
            Reset Token *
          </label>
          <input
            type="text"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Enter reset token"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 transition"
          />
        </div>

        {/* NEW PASSWORD */}
        <div>
          <label className="mb-1.5 block font-bold uppercase tracking-wider text-[10px] text-slate-500">
            New Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-14 font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <label className="mb-1.5 block font-bold uppercase tracking-wider text-[10px] text-slate-500">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter new password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-14 font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer pt-3.5"
        >
          {loading ? "Updating Password..." : "Reset Password →"}
        </button>
      </form>

      {/* LOGIN LINK */}
      <div className="mt-6 text-center border-t border-slate-100 pt-4">
        <Link
          href="/login"
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <Suspense
        fallback={
          <div className="text-xs font-bold text-slate-500 animate-pulse">
            Loading secure form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}