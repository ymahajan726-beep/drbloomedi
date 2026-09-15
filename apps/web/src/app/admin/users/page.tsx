"use client";

import { useEffect, useState } from "react";
import { secureFetch } from "@/utils/api";

type User = {
  id: string | number;
  email: string;
  role: string;
  isActive: boolean;
  name?: string;
  fullName?: string;
  phone?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form State for New Staff
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
    phone: "",
    specialization: "General Physician",
    consultationFee: 500,
  });

  async function fetchUsers() {
    try {
      const response = await secureFetch("/users", {
        method: "GET",
        cache: "no-store",
      });

      console.log("USERS STATUS:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const staffOnly = list.filter(
        (u: User) => u.role?.toUpperCase() !== "PATIENT",
      );
      setUsers(staffOnly);
    } catch (error) {
      console.error("USERS FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        name: formData.name.trim(),
        fullName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role.toUpperCase(),
        phone: formData.phone.trim() || undefined,
      };

      if (formData.role.toUpperCase() === "DOCTOR") {
        payload.specialization =
          formData.specialization.trim() || "General Physician";
        payload.consultationFee = Number(formData.consultationFee) || 500;
      }

      const response = await secureFetch("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("CREATE USER STATUS:", response.status);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            "Failed to create staff account. Email may already be taken.",
        );
      }

      // If doctor role, trigger doctor profile entry guarantee
      if (formData.role.toUpperCase() === "DOCTOR") {
        try {
          await secureFetch("/doctors", {
            method: "POST",
            body: JSON.stringify({
              email: formData.email.trim().toLowerCase(),
              specialization:
                formData.specialization.trim() || "General Physician",
              consultationFee: Number(formData.consultationFee) || 500,
            }),
          });
        } catch (_) {}
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "DOCTOR",
        phone: "",
        specialization: "General Physician",
        consultationFee: 500,
      });

      setShowModal(false);
      await fetchUsers();
    } catch (error: any) {
      console.error("CREATE USER ERROR:", error);
      setFormError(error.message || "Error saving staff member.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(id: string | number, currentStatus: boolean) {
    try {
      const response = await secureFetch(`/users/${id}/active`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      await fetchUsers();
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);
    }
  }

  async function deleteUser(id: string | number) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this staff member?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await secureFetch(`/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await fetchUsers();

      setToast({
        type: "success",
        message: "Staff member deleted successfully.",
      });
    } catch (error) {
      console.error("DELETE USER ERROR:", error);

      setToast({
        type: "error",
        message: "Failed to delete staff member.",
      });
    }
  }

  const filteredUsers =
    filterRole === "ALL"
      ? users
      : users.filter(
          (u) => u.role && u.role.toUpperCase() === filterRole.toUpperCase(),
        );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-900 dark:bg-slate-950 dark:text-gray-100">
        <h1 className="text-3xl font-bold">
          Staff & Personnel Directory
        </h1>
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Loading authorized personnel...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-6 top-6 z-[100]">
          <div
            className={`flex items-center gap-3 rounded-xl border px-5 py-3 shadow-xl ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            <span className="text-lg">
              {toast.type === "success" ? "✓" : "✕"}
            </span>
            <span className="text-sm font-semibold">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hospital Staff & Personnel
          </h1>
          <p className="mt-1 text-gray-700 dark:text-gray-300">
            Onboard doctors, front desk receptionists, and hospital administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span>➕</span> Add New Staff Member
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {["ALL", "DOCTOR", "RECEPTION", "ADMIN"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilterRole(r)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              filterRole === r
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-300 dark:hover:bg-slate-800"
            }`}
          >
            {r === "ALL" ? "ALL STAFF" : r}
          </button>
        ))}

        <span className="ml-auto text-xs font-semibold text-gray-500 dark:text-gray-400">
          Showing {filteredUsers.length} active personnel
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-700 dark:text-gray-300">
            No hospital staff found in this role category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-900 dark:text-gray-100">
              <thead className="border-b border-gray-300 bg-gray-100 dark:border-slate-700 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    Staff Identity
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    Department / Role
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    Access Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {String(user.id).slice(0, 8)}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {user.fullName ||
                          user.name ||
                          user.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          📞 {user.phone}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === "DOCTOR"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : user.role === "RECEPTION"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {user.isActive !== false ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(user.id, user.isActive !== false)
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                        >
                          {user.isActive !== false
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/90 p-4 backdrop-blur-sm dark:bg-slate-950/90">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Onboard Hospital Personnel
              </h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-lg font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Full Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Official Email / Username *
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@drbloomedi.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Login Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Hospital Role & Permission Group *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="DOCTOR">
                    Doctor (Consultation Desk & EMR Rx)
                  </option>
                  <option value="RECEPTION">
                    Receptionist (OPD Queue & Token Desk)
                  </option>
                  <option value="ADMIN">
                    Hospital Administrator
                  </option>
                </select>
              </div>

              {formData.role === "DOCTOR" && (
                <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <div>
                    <label className="mb-1 block font-semibold text-blue-900 dark:text-blue-300">
                      Doctor Specialization *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cardiologist, General Physician"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-blue-900 dark:text-blue-300">
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="500"
                      value={formData.consultationFee}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultationFee: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500 dark:border-blue-800 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}