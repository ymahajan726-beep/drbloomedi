"use client";

import { useEffect, useState } from "react";
import { secureFetch } from "@/utils/api";

type User = {
  id: string | number;
  email: string;
  role: string;
  isActive: boolean;
  name?: string;
  phone?: string;
  specialization?: string;
  consultationFee?: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | number | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  function handleOpenCreateModal() {
    setEditingUserId(null);
    setFormError(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "DOCTOR",
      phone: "",
      specialization: "General Physician",
      consultationFee: 500,
    });
    setShowModal(true);
  }

  function handleOpenEditModal(user: User) {
    setEditingUserId(user.id);
    setFormError(null);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "DOCTOR",
      phone: user.phone || "",
      specialization: user.specialization || "General Physician",
      consultationFee: user.consultationFee || 500,
    });
    setShowModal(true);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const trimmedName = formData.name.trim();
      const payload: any = {
        name: trimmedName,
        email: formData.email.trim().toLowerCase(),
        role: formData.role.toUpperCase(),
        phone: formData.phone.trim() || undefined,
      };

      if (formData.password.trim() !== "") {
        payload.password = formData.password;
      } else if (!editingUserId) {
        throw new Error("Password is required for new accounts.");
      }

      if (formData.role.toUpperCase() === "DOCTOR") {
        payload.specialization =
          formData.specialization.trim() || "General Physician";
        payload.consultationFee = Number(formData.consultationFee) || 500;
      }

      const endpoint = editingUserId ? `/users/${editingUserId}` : "/users";
      const method = editingUserId ? "PATCH" : "POST";

      const response = await secureFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            (editingUserId
              ? "Failed to update staff account."
              : "Failed to create staff account. Email may already be taken."),
        );
      }

      if (formData.role.toUpperCase() === "DOCTOR") {
        try {
          await secureFetch("/doctors", {
            method: "POST",
            body: JSON.stringify({
              name: trimmedName,
              email: formData.email.trim().toLowerCase(),
              specialization:
                formData.specialization.trim() || "General Physician",
              consultationFee: Number(formData.consultationFee) || 500,
            }),
          });
        } catch (_) {}
      }

      setShowModal(false);
      await fetchUsers();

      setToast({
        type: "success",
        message: editingUserId
          ? "Staff member updated successfully."
          : "Staff member onboarded successfully.",
      });
    } catch (error: any) {
      console.error("SAVE USER ERROR:", error);
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
      <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Loading authorized personnel...
      </div>
    );
  }

  const field =
    'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {toast && (
        <div className="fixed right-6 top-6 z-[100]">
          <div
            className={`flex items-center gap-3 rounded-xl border px-5 py-3 shadow-xl ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/80 dark:text-rose-300"
            }`}
          >
            <span className="text-base font-bold">
              {toast.type === "success" ? "✓" : "✕"}
            </span>
            <span className="text-xs font-semibold">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            STAFF
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Hospital Staff & Personnel
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Onboard doctors, front desk receptionists, and hospital administrators.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-emerald-600/20 shadow-md"
        >
          <span>+</span> Add New Staff Member
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "DOCTOR", "RECEPTION", "ADMIN"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilterRole(r)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                  filterRole === r
                    ? "bg-emerald-600 text-white shadow-emerald-600/20 shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {r === "ALL" ? "ALL STAFF" : r}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
            Showing {filteredUsers.length} active personnel
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No hospital staff found in this role category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[10px]">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Staff Identity</th>
                    <th className="py-3 px-3">Mobile No</th>
                    <th className="py-3 px-3">Department / Role</th>
                    <th className="py-3 px-3">Access Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {String(user.id).slice(0, 8)}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {user.name || user.email.split("@")[0]}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {user.email}
                        </p>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {user.phone ? user.phone : <span className="text-slate-400 italic">Not Provided</span>}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold border ${
                            user.role === "DOCTOR"
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                              : user.role === "RECEPTION"
                              ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900"
                              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {user.isActive !== false ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                            Active
                          </span>
                        ) : (
                          <span className="rounded-md bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(user.id, user.isActive !== false)
                            }
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700"
                          >
                            {user.isActive !== false
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteUser(user.id)}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 border border-rose-200 dark:border-rose-900/50"
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
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {editingUserId ? "Edit Hospital Personnel" : "Onboard Hospital Personnel"}
              </h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 p-3 font-semibold text-rose-700 dark:text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
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
                  className={field}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
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
                  className={field}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Login Password {editingUserId ? "(Leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  placeholder={editingUserId ? "Enter new password if changing" : "At least 6 characters"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={field}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={field}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Hospital Role & Permission Group *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className={field}
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
                <div className="space-y-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-300 uppercase mb-1">
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
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-300 uppercase mb-1">
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
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer active:scale-95 shadow-emerald-600/20 shadow-md"
                >
                  {submitting
                    ? "Saving..."
                    : editingUserId
                    ? "Update Staff Account"
                    : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}