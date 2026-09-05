'use client';

import React, { useState, useEffect } from 'react';

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
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [matrix, setMatrix] = useState<RoleDefinition[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New Staff Registration Modal States
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
      let usersUrl = `http://localhost:4000/roles/users?search=${encodeURIComponent(search)}`;
      if (roleFilter) usersUrl += `&role=${encodeURIComponent(roleFilter)}`;

      const [usersRes, matrixRes] = await Promise.all([
        fetch(usersUrl),
        fetch('http://localhost:4000/roles/matrix'),
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
      await fetch(`http://localhost:4000/roles/users/${userId}/role`, {
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
      await fetch(`http://localhost:4000/roles/users/${userId}/toggle`, {
        method: 'PATCH',
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Checkbox toggle handler
  const togglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  // Register New Staff Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      alert('Email and Password are required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('http://localhost:4000/admin/users/create', {
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

      alert('Staff user registered successfully!');
      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setSelectedPermissions(['OPD_MANAGE', 'BILLING_MANAGE']);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            User Roles & Access Permissions
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Role-Based Access Control (RBAC) • Account Privileges & Suspension
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Register New Staff</span>
        </button>
      </div>

      {/* Role Permission Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {matrix.map((r) => (
          <div
            key={r.role}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                {r.role}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {users.filter((u) => u.role === r.role).length} Users
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
              {r.permissions.map((p, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search accounts by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50/50 outline-none"
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

      {/* Users Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading system accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-4xl block mb-2">🛡️</span>
            <p className="text-sm font-semibold text-slate-700">No accounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Account Email</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Registration Date</th>
                  <th className="p-4">Login Status</th>
                  <th className="p-4 text-right">Access Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">{u.email}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="font-bold text-xs px-2.5 py-1 border border-slate-200 rounded-lg outline-none cursor-pointer bg-white text-slate-800"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="DOCTOR">DOCTOR</option>
                        <option value="RECEPTION">RECEPTION</option>
                        <option value="PHARMACIST">PHARMACIST</option>
                        <option value="LAB_TECH">LAB_TECH</option>
                        <option value="PATIENT">PATIENT</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? '● ACTIVE' : '○ SUSPENDED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          u.isActive
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
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

      {/* Staff Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-900">Register Staff Credentials</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create login ID, password, and assign granular permissions.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">User ID / Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. nurse.radha@drbloomedi.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Temporary password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Base System Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs border border-slate-200 rounded-xl outline-none font-bold bg-slate-50"
                >
                  <option value="RECEPTION">Receptionist / Front Desk</option>
                  <option value="DOCTOR">Doctor / Medical Officer</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="LAB_TECH">Lab Technician / Pathologist</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {/* Granular Permission Checkbox Matrix */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
                  Granular Modular Permissions (Tick to Grant Access)
                </label>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">{perm.label}</span>
                        <span className="text-[10px] text-slate-400 block">{perm.category} Module</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
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