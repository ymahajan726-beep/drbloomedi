"use client";

import { useEffect, useState } from "react";

const API_URL = "https://drbloomedi-backend.onrender.com";

type User = {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
  name?: string;
  phone?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State for New Staff
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
    phone: "",
  });

  async function fetchUsers() {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      console.log("USERS STATUS:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      console.log("USERS RESPONSE:", data);

      const staffOnly = data.filter((u: User) => u.role?.toUpperCase() !== "PATIENT");
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

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      // Backend database enum standard format: DOCTOR | RECEPTION | ADMIN
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role.toUpperCase(),
        phone: formData.phone.trim() || undefined,
      };

      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log("CREATE USER STATUS:", response.status);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create staff account. Email may already be taken.");
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "DOCTOR",
        phone: "",
      });
      setShowModal(false);
      await fetchUsers();
    } catch (error: any) {
      console.error("CREATE USER ERROR:", error);
      setFormError(error.message || "Error saving staff member. Check database enum format.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(id: number, currentStatus: boolean) {
    try {
      const response = await fetch(`${API_URL}/users/${id}/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      console.log("STATUS UPDATE:", response.status);

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      await fetchUsers();
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);
    }
  }

  async function deleteUser(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this staff member?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("DELETE STATUS:", response.status);

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await fetchUsers();
    } catch (error) {
      console.error("DELETE USER ERROR:", error);
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
      <div className="p-8 text-gray-900 font-sans">
        <h1 className="text-3xl font-bold">Staff & Personnel Directory</h1>
        <p className="mt-4 text-gray-700">Loading authorized personnel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900 font-sans">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Staff & Personnel</h1>
          <p className="mt-1 text-gray-700">
            Onboard doctors, front desk receptionists, and hospital administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
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
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {r === "ALL" ? "ALL STAFF" : r}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-gray-500">
          Showing {filteredUsers.length} active personnel
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-700">
            No hospital staff found in this role category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-900">
              <thead className="border-b border-gray-300 bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Staff Identity
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Department / Role
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Access Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.id}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      <p className="font-bold text-gray-900">
                        {user.name || user.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.phone && (
                        <p className="text-[11px] text-gray-400">📞 {user.phone}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === "DOCTOR"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "RECEPTION"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span> Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(user.id, user.isActive)
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Onboard Hospital Personnel
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
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
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
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
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
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
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Hospital Role & Permission Group *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="DOCTOR">Doctor (Consultation Desk & EMR Rx)</option>
                  <option value="RECEPTION">Receptionist (OPD Queue & Token Desk)</option>
                  <option value="ADMIN">Hospital Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
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