
"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

const API_URL = "http://localhost:4000";

export default function NewDoctorPage() {
  const router = useRouter();

  // =====================================================
  // FORM DATA
  // =====================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [specialization, setSpecialization] =
    useState("");

  const [qualifications, setQualifications] =
    useState("");

  const [phone, setPhone] =
    useState("");

  // =====================================================
  // PAGE STATE
  // =====================================================

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // CREATE DOCTOR
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Basic validation

    if (!email.trim()) {
      setError(
        "Email is required.",
      );

      return;
    }

    if (!password) {
      setError(
        "Password is required.",
      );

      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          `${API_URL}/doctors`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              email:
                email.trim(),

              password,

              specialization:
                specialization.trim(),

              qualifications:
                qualifications.trim(),

              phone:
                phone.trim(),
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create doctor.",
        );
      }

      setSuccess(
        "Doctor created successfully.",
      );

      // Clear form

      setEmail("");
      setPassword("");
      setSpecialization("");
      setQualifications("");
      setPhone("");

      // Go back to doctors list

      setTimeout(() => {
        router.push(
          "/admin/doctors",
        );
      }, 800);
    } catch (error) {
      console.error(
        "Create doctor failed:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create doctor.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b bg-white px-8 py-5">
        <div className="mx-auto max-w-4xl">

          <h1 className="text-2xl font-bold text-gray-900">
            Add Doctor
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new doctor account
            and profile.
          </p>

        </div>
      </header>

      {/* =================================================
          FORM
      ================================================= */}

      <section className="mx-auto max-w-4xl px-6 py-8">

        <div className="rounded-xl bg-white p-6 shadow-sm">

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* =================================================
                ACCOUNT INFORMATION
            ================================================= */}

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                These details will be used
                for the doctor's login.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="doctor@example.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

            </div>

            {/* =================================================
                DOCTOR INFORMATION
            ================================================= */}

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Doctor Details
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                {/* SPECIALIZATION */}

                <div>
                  <label
                    htmlFor="specialization"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Specialization
                  </label>

                  <input
                    id="specialization"
                    type="text"
                    autoComplete="off"
                    value={specialization}
                    onChange={(event) =>
                      setSpecialization(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Cardiology"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* QUALIFICATIONS */}

                <div>
                  <label
                    htmlFor="qualifications"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Qualifications
                  </label>

                  <input
                    id="qualifications"
                    type="text"
                    autoComplete="off"
                    value={qualifications}
                    onChange={(event) =>
                      setQualifications(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. MBBS, MD"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Phone
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    autoComplete="off"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value,
                      )
                    }
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

            </div>

            {/* =================================================
                SUCCESS / ERROR
            ================================================= */}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="flex items-center gap-3 border-t pt-6">

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Doctor"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  router.push(
                    "/admin/doctors",
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </section>

    </main>
  );
}

