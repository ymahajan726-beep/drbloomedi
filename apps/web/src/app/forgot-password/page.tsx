
"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

const API_URL = "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email) {
      setError(
        "Please enter your email address.",
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/auth/forgot-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              email,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to process request.",
        );
      }

      setMessage(
        data.message ||
          "Password reset request sent successfully.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-gray-900">
            Forgot Password
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your email to reset your password
          </p>

        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-900">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="admin@drbloomedi.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Sending..."
              : "Send Reset Request"}
          </button>

        </form>

        {/* BACK TO LOGIN */}

        <div className="mt-6 text-center">

          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Login
          </Link>

        </div>

      </div>

    </main>
  );
}

