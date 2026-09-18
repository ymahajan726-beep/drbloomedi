'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

interface UserAccount {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  permissions?: string[];
}

interface RoleDefinition {
  role: string;
  description: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { key: 'OPD_MANAGE', label: 'OPD & Appointments', category: 'Clinical' },
  { key: 'DOCTOR_CONSOLE', label: 'Doctor OPD Console & Rx', category: 'Clinical' },
  { key: 'BILLING_MANAGE', label: 'Billing Counter & Invoicing', category: 'Finance' },
  { key: 'PHARMACY_DISPENSE', label: 'Pharmacy Inventory & Dispense', category: 'Pharmacy' },
  { key: 'LAB_MANAGE', label: 'Lab Orders & Diagnostic Entry', category: 'Diagnostics' },
  { key: 'EMR_ACCESS', label: 'Patient 360° EMR & Dossier', category: 'Medical Records' },
  { key: 'IPD_MANAGE', label: 'IPD Bed Allocation & Discharge', category: 'In-Patient' },
];

export default function RolesManagementPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [matrix, setMatrix] = useState<RoleDefinition[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('RECEPTION');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'OPD_MANAGE',
    'BILLING_MANAGE',
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      let usersUrl = `https://drbloomedi-backend.onrender.com/roles/users?search=${encodeURIComponent(search)}`;
      if (roleFilter) usersUrl += `&role=${encodeURIComponent(roleFilter)}`;

      const [usersRes, matrixRes] = await Promise.all([
        fetch(usersUrl),
        fetch('https://drbloomedi-backend.onrender.com/roles/matrix'),
      ]);

      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(Array.isArray(u) ? u : []);
      }
      if (matrixRes.ok) {
        const m = await matrixRes.json();
        setMatrix(Array.isArray(m) ? m : []);
      }
    } catch (err) {
      console.error('Failed to load roles data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter]);

  const handleRoleChange = async (userId: string, newRoleValue: string) => {
    try {
      await fetch(`https://drbloomedi-backend.onrender.com/roles/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRoleValue }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      await fetch(`https://drbloomedi-backend.onrender.com/roles/users/${userId}/toggle`, {
        method: 'PATCH',
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      showToast('Email and Password are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('https://drbloomedi-backend.onrender.com/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          permissions: selectedPermissions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to create user');
      }

      showToast('Staff user registered successfully!', 'success');
      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setSelectedPermissions(['OPD_MANAGE', 'BILLING_MANAGE']);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error creating user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            RBAC
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              User Roles & Access Permissions
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Role-Based Access Control (RBAC) • Account Privileges & Suspension
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>+</span>
          <span>Register New Staff</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Role Permission Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {matrix.map((r) => (
            <div
              key={r.role}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md border border-slate-200 dark:border-slate-700 font-mono">
                    {r.role}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    {users.filter((u) => u.role === r.role).length} Users
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">{r.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                {r.permissions.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded border border-slate-200 dark:border-slate-700"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search accounts by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition font-medium"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-600 transition font-semibold"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="RECEPTION">RECEPTION</option>
            <option value="PHARMACIST">PHARMACIST</option>
            <option value="LAB_TECH">LAB_TECH</option>
            <option value="PATIENT">PATIENT</option>
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              Loading system accounts...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="text-4xl block mb-2">🛡️</span>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No accounts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Account Email</th>
                    <th className="py-3 px-3">Assigned Role</th>
                    <th className="py-3 px-3">Registration Date</th>
                    <th className="py-3 px-3">Login Status</th>
                    <th className="py-3 px-3 text-right">Access Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-mono">{u.email}</td>
                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="font-semibold text-[11px] px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-md outline-none cursor-pointer bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="DOCTOR">DOCTOR</option>
                          <option value="RECEPTION">RECEPTION</option>
                          <option value="PHARMACIST">PHARMACIST</option>
                          <option value="LAB_TECH">LAB_TECH</option>
                          <option value="PATIENT">PATIENT</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-md font-semibold text-[10px] border ${
                            u.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                          }`}
                        >
                          {u.isActive ? '● ACTIVE' : '○ SUSPENDED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs ${
                            u.isActive
                              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900'
                              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900'
                          }`}
                        >
                          {u.isActive ? 'Suspend Access' : 'Restore Access'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Register Staff Credentials</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Create login ID, password, and assign granular permissions.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">User ID / Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. nurse.radha@drbloomedi.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={field}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Temporary password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Base System Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className={field}
                >
                  <option value="RECEPTION">Receptionist / Front Desk</option>
                  <option value="DOCTOR">Doctor / Medical Officer</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="LAB_TECH">Lab Technician / Pathologist</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-2">
                  Granular Modular Permissions (Tick to Grant Access)
                </label>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2.5 p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{perm.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{perm.category} Module</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs transition cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Confirm & Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}