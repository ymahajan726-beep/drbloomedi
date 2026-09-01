
"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:4000";

type User = {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

      setUsers(data);
    } catch (error) {
      console.error("USERS FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function toggleStatus(
    id: number,
    currentStatus: boolean,
  ) {
    try {
      const response = await fetch(
        `${API_URL}/users/${id}/active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            isActive: !currentStatus,
          }),
        },
      );

      console.log(
        "STATUS UPDATE:",
        response.status,
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update user status",
        );
      }

      await fetchUsers();
    } catch (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error,
      );
    }
  }

  async function deleteUser(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/users/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      console.log(
        "DELETE STATUS:",
        response.status,
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete user",
        );
      }

      await fetchUsers();
    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error,
      );
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-gray-900">
        <h1 className="text-3xl font-bold">
          Users
        </h1>

        <p className="mt-4 text-gray-700">
          Loading users...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Users
        </h1>

        <p className="mt-1 text-gray-700">
          Manage system users and their account status.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-700">
            No users found.
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
                    Email
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.id}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(
                              user.id,
                              user.isActive,
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                        >
                          {user.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteUser(user.id)
                          }
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
    </div>
  );
}

