'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  batchNumber?: string;
  stockQuantity: number;
  minStockAlert: number;
  unitPrice: number;
  expiryDate?: string;
  manufacturer?: string;
}

export default function PharmacyInventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dispenseMed, setDispenseMed] = useState<Medicine | null>(null);
  const [dispenseQty, setDispenseQty] = useState(1);
  const [dispenseLoading, setDispenseLoading] = useState(false);

  // New Medicine Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Tablet',
    batchNumber: '',
    stockQuantity: 50,
    minStockAlert: 10,
    unitPrice: 10,
    expiryDate: '',
    manufacturer: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. Auth Guard
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const token = getCookie('token') || localStorage.getItem('token');
    const role = (getCookie('userRole') || localStorage.getItem('userRole'))?.toUpperCase();

    if (!token || (role !== 'ADMIN' && role !== 'PHARMACY' && role !== 'RECEPTION')) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  // 2. Fetch Medicines
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search.trim()) query.append('search', search.trim());
      if (categoryFilter) query.append('category', categoryFilter);

      const res = await fetch(`http://localhost:4000/pharmacy?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchInventory();
    }
  }, [isAuthorized, search, categoryFilter]);

  // 3. Handle Add New Medicine
  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      setFormSubmitting(true);
      const res = await fetch('http://localhost:4000/pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to add medicine');
      }

      setIsAddModalOpen(false);
      setFormData({
        name: '',
        genericName: '',
        category: 'Tablet',
        batchNumber: '',
        stockQuantity: 50,
        minStockAlert: 10,
        unitPrice: 10,
        expiryDate: '',
        manufacturer: '',
      });
      fetchInventory();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };

  // 4. Handle Quick Dispense (Stock Deduction)
  const handleDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseMed) return;

    try {
      setDispenseLoading(true);
      const res = await fetch(`http://localhost:4000/pharmacy/${dispenseMed.id}/dispense`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(dispenseQty) }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Dispense failed');
      }

      setDispenseMed(null);
      setDispenseQty(1);
      fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Dispense error');
    } finally {
      setDispenseLoading(false);
    }
  };

  // Check Expiry Status Helper
  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr).getTime();
    const today = new Date().getTime();
    const daysLeft = (expiry - today) / (1000 * 3600 * 24);
    return daysLeft <= 45; // Warning if within 45 days
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-xs">
        🔒 Checking Pharmacy Counter Permissions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Pharmacy & Medicine Inventory</h1>
            <p className="text-xs text-slate-400">Stock In-Hand • Batch & Expiry Tracking • Dispensing Desk</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Add New Medicine</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[260px]">
            <input
              type="text"
              placeholder="Search by drug name, generic formula, batch #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none"
            >
              <option value="">All Categories</option>
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
              <option value="Ointment">Ointment</option>
              <option value="Drops">Drops</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Medicine Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Batch / Mfr</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading pharmacy stock...</td>
                  </tr>
                ) : medicines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                      No medicines registered in inventory yet. Click "+ Add New Medicine" above.
                    </td>
                  </tr>
                ) : (
                  medicines.map((med) => {
                    const isLowStock = med.stockQuantity <= med.minStockAlert;
                    const expiring = isExpiringSoon(med.expiryDate);

                    return (
                      <tr key={med.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{med.genericName || 'No Generic Name'}</div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md text-[10px]">
                            {med.category}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600">
                          <div className="font-mono text-xs font-semibold">{med.batchNumber || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400">{med.manufacturer || '-'}</div>
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          ₹{Number(med.unitPrice).toFixed(2)}
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-black ${
                                isLowStock
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {med.stockQuantity} in stock
                            </span>
                          </div>
                          {isLowStock && (
                            <span className="text-[9px] text-rose-500 font-bold block mt-0.5">
                              ⚠️ Below min limit ({med.minStockAlert})
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {med.expiryDate ? (
                            <div>
                              <span className={`font-mono text-[11px] font-bold ${expiring ? 'text-amber-600' : 'text-slate-700'}`}>
                                {med.expiryDate}
                              </span>
                              {expiring && (
                                <span className="block text-[9px] text-amber-500 font-bold">⚠️ Expiring Soon</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            disabled={med.stockQuantity <= 0}
                            onClick={() => {
                              setDispenseMed(med);
                              setDispenseQty(1);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
                          >
                            💊 Dispense
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================
          ADD NEW MEDICINE MODAL
          ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Add New Medicine to Stock</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleAddMedicine} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Generic Formula</label>
                  <input
                    type="text"
                    placeholder="e.g. Acetaminophen"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. B-9982"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Min Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla / Sun Pharma"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full mt-1 p-2 text-xs border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  {formSubmitting ? 'Saving...' : 'Save to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DISPENSE MEDICINE POPUP MODAL
          ======================================================== */}
      {dispenseMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900">Dispense Medicine</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quick Stock Deduction at Counter</p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="font-bold text-slate-900">{dispenseMed.name}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Current Stock: <span className="font-mono font-bold text-emerald-600">{dispenseMed.stockQuantity}</span> | Unit Price: ₹{dispenseMed.unitPrice}
              </div>
            </div>

            <form onSubmit={handleDispenseSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity to Dispense</label>
                <input
                  type="number"
                  min="1"
                  max={dispenseMed.stockQuantity}
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(Number(e.target.value))}
                  className="w-full mt-1.5 p-2.5 text-sm border border-slate-200 rounded-xl outline-none font-mono font-bold text-slate-900 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Total Billable: ₹{(Number(dispenseQty) * Number(dispenseMed.unitPrice)).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispenseMed(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispenseLoading || dispenseQty <= 0 || dispenseQty > dispenseMed.stockQuantity}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {dispenseLoading ? 'Deducting...' : 'Confirm Dispense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}