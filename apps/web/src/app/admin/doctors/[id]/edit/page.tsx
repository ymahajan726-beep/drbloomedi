
"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";

type DoctorUser = {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
};

type Doctor = {
  id: number;
  user: DoctorUser;
  specialization?: string | null;
  qualifications?: string | null;
  phone?: string | null;
  isActive: boolean;
};

const API_URL = "http://localhost:4000";

export default function EditDoctorPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  // =====================================================
  // DOCTOR
  // =====================================================

  const [doctor, setDoctor] =
    useState<Doctor | null>(null);

  // =====================================================
  // FORM
  // =====================================================

  const [specialization, setSpecialization] =
    useState("");

  const [qualifications, setQualifications] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [isActive, setIsActive] =
    useState(true);

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // LOAD DOCTOR
  // =====================================================

  useEffect(() => {
    async function loadDoctor() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/doctors/${id}`,
            {
              method: "GET",
              credentials: "include",
            },
          );

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            throw new Error(
              "You are not authorized to view this doctor.",
            );
          }

          if (
            response.status === 404
          ) {
            throw new Error(
              "Doctor not found.",
            );
          }

          throw new Error(
            "Failed to load doctor.",
          );
        }

        const data =
          await response.json();

        setDoctor(data);

        setSpecialization(
          data.specialization || "",
        );

        setQualifications(
          data.qualifications || "",
        );

        setPhone(
          data.phone || "",
        );

        setIsActive(
          data.isActive ?? true,
        );
      } catch (error) {
        console.error(
          "Doctor loading failed:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load doctor.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDoctor();
    }
  }, [id]);

  // =====================================================
  // UPDATE DOCTOR
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/doctors/${id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              specialization:
                specialization.trim(),

              qualifications:
                qualifications.trim(),

              phone:
                phone.trim(),

              isActive,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to update doctor.",
        );
      }

      setSuccess(
        "Doctor updated successfully.",
      );

      setDoctor(data);

      setTimeout(() => {
        router.push(
          `/admin/doctors/${id}`,
        );
      }, 800);
    } catch (error) {
      console.error(
        "Doctor update failed:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update doctor.",
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">

        <div className="mx-auto max-w-4xl px-6 py-10">

          <div className="rounded-xl bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Loading doctor...
            </p>

          </div>

        </div>

      </main>
    );
  }

  // =====================================================
  // ERROR / NOT FOUND
  // =====================================================

  if (!doctor) {
    return (
      <main className="min-h-screen bg-gray-100">

        <div className="mx-auto max-w-4xl px-6 py-10">

          <div className="rounded-xl bg-white p-6 shadow-sm">

            <h1 className="text-xl font-semibold text-gray-900">
              Doctor not found
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error ||
                "Unable to load doctor."}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/admin/doctors",
                )
              }
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to Doctors
            </button>

          </div>

        </div>

      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b bg-white px-8 py-5">

        <div className="mx-auto max-w-4xl">

          <h1 className="text-2xl font-bold text-gray-900">
            Edit Doctor
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update doctor information.
          </p>

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="mx-auto max-w-4xl px-6 py-8">

        <div className="rounded-xl bg-white p-6 shadow-sm">

          {/* =================================================
              ACCOUNT INFORMATION
          ================================================= */}

          <div className="mb-8">

            <h2 className="text-lg font-semibold text-gray-900">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Doctor login account information.
            </p>

            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={
                  doctor.user?.email || ""
                }
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600 outline-none"
              />

              <p className="mt-2 text-xs text-gray-400">
                Email cannot be changed from
                this page.
              </p>

            </div>

          </div>

          {/* =================================================
              DOCTOR DETAILS
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

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
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* ACTIVE */}

                <div className="flex items-center gap-3 md:col-span-2">

                  <input
                    id="active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4"
                  />

                  <label
                    htmlFor="active"
                    className="text-sm font-medium text-gray-700"
                  >
                    Doctor is Active
                  </label>

                </div>

              </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

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
                  ? "Saving..."
                  : "Save Changes"}
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

