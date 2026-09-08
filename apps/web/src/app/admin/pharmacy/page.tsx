'use client';

import React, { useState, useEffect } from 'react';

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  batchNumber: string;
  stockQuantity: number;
  unitPrice: number;
  expiryDate: string;
  isExpired?: boolean;
  isLowStock?: boolean;
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<'counter' | 'inventory' | 'add'>('counter');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pharmacy Counter States
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [dispensing, setDispensing] = useState(false);

  // Invoice Modal State
  const [invoiceModal, setInvoiceModal] = useState<any | null>(null);

  // Add Medicine Form State
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    loadPharmacyData();
  }, []);

  const loadPharmacyData = async () => {
    try {
      setLoading(true);
      const [medsRes, patRes] = await Promise.all([
        fetch('https://drbloomedi-backend.onrender.com/pharmacy/inventory').catch(() => null),
        fetch('https://drbloomedi-backend.onrender.com/patients').catch(() => null),
      ]);

      if (medsRes?.ok) {
        const medsData = await medsRes.json();
        setMedicines(medsData);
      }
      if (patRes?.ok) {
        setPatients(await patRes.json());
      }
    } catch (err) {
      console.error('Failed to load pharmacy data', err);
    } finally {
      setLoading(false);
    }
  };

  // Add Item to Multi-Medicine Cart
  const handleAddToCart = () => {
    if (!selectedMedId) {
      alert('Please select a medicine');
      return;
    }
    const med = medicines.find((m) => m.id === selectedMedId);
    if (!med) return;

    const qty = parseInt(selectedQty, 10) || 1;
    if (qty <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (qty > med.stockQuantity) {
      alert(`Only ${med.stockQuantity} units available in stock`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.medicine.id === med.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + qty;
      if (newQty > med.stockQuantity) {
        alert(`Cannot add more. Maximum available stock is ${med.stockQuantity}`);
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
      setCart(updatedCart);
    } else {
      setCart([...cart, { medicine: med, quantity: qty }]);
    }

    setSelectedMedId('');
    setSelectedQty('1');
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.medicine.id !== id));
  };

  // Process Dispense & Generate Bill
  const handleProcessSale = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient for pharmacy billing');
      return;
    }
    if (cart.length === 0) {
      alert('Please add at least one medicine to the cart');
      return;
    }

    try {
      setDispensing(true);
      const payload = {
        patientId: selectedPatientId,
        items: cart.map((c) => ({
          medicineId: c.medicine.id,
          quantity: c.quantity,
        })),
        paymentMethod: 'CASH',
      };

      const res = await fetch('https://drbloomedi-backend.onrender.com/pharmacy/dispense-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Dispensing failed on server');
      }

      const invoiceData = await res.json();
      setInvoiceModal(invoiceData);
      setCart([]);
      setSelectedPatientId('');
      await loadPharmacyData();
    } catch (err: any) {
      alert(`Sales Dispense Error: ${err.message}`);
    } finally {
      setDispensing(false);
    }
  };

  // Add New Medicine to Stock
  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('https://drbloomedi-backend.onrender.com/pharmacy/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          genericName,
          batchNumber,
          stockQuantity: Number(stockQuantity),
          unitPrice: Number(unitPrice),
          expiryDate,
        }),
      });

      if (!res.ok) throw new Error('Failed to save medicine');
      alert('Medicine Stock Added Successfully!');

      setName('');
      setGenericName('');
      setBatchNumber('');
      setStockQuantity('');
      setUnitPrice('');
      setExpiryDate('');

      // Reload so dropdown updates immediately
      await loadPharmacyData();
      setActiveTab('counter');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Live Multi-Item Calculations
  const cartSubTotal = cart.reduce(
    (sum, item) => sum + item.medicine.unitPrice * item.quantity,
    0,
  );
  const cartGst = cartSubTotal * 0.05;
  const cartTotal = cartSubTotal + cartGst;

  const filteredMeds = medicines.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.batchNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase">
            Module 7 • Pharmacy & Inventory[cite: 1]
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Hospital Pharmacy & Store</h1>
          <p className="text-xs text-slate-500">
            Multi-Medicine Dispense Counter, Live Stock Management & GST Invoicing[cite: 1]
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('counter')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'counter' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
            }`}
          >
            🛒 Dispense Counter ({cart.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'inventory' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
            }`}
          >
            📦 Stock Inventory
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'add' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
            }`}
          >
            + Add Medicine Batch
          </button>
        </div>
      </div>

      {/* 1. DISPENSE COUNTER TAB */}
      {activeTab === 'counter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-slate-900 uppercase">Dispense Multi-Medicine Cart</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Select Patient *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="">-- Choose Patient for Invoice --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Choose Medicine ({medicines.length} in stock)
                  </label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  >
                    <option value="">-- Select Medicine --</option>
                    {medicines
                      .filter((m) => Number(m.stockQuantity) > 0)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} | Batch: {m.batchNumber} | Stock: {m.stockQuantity} | ₹{m.unitPrice}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs transition"
              >
                + Add To Patient Bill Cart
              </button>
            </div>

            {/* Multiple Medicines in Cart */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase mb-2">
                Cart Items ({cart.length})
              </h3>
              {cart.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Cart is empty. Select medicines above to add multiple items.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {cart.map((item) => (
                    <div key={item.medicine.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{item.medicine.name}</p>
                        <p className="text-[10px] text-slate-400">
                          ₹{item.medicine.unitPrice} × {item.quantity} units (Batch: {item.medicine.batchNumber})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">
                          ₹{(item.medicine.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(item.medicine.id)}
                          className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Consolidated Multi-Medicine Bill */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase mb-4">
                Pharmacy Tax Invoice
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items in Cart:</span>
                  <span className="font-bold">{cart.length} Medicines</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sub Total:</span>
                  <span className="font-bold">₹{cartSubTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%):</span>
                  <span className="font-bold">₹{cartGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-dashed border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={dispensing || cart.length === 0 || !selectedPatientId}
              onClick={handleProcessSale}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              {dispensing ? 'Generating GST Invoice...' : '✓ Dispense & Settle Bill'}
            </button>
          </div>
        </div>
      )}

      {/* 2. INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <input
            type="text"
            placeholder="Search by Medicine Name, Generic Name or Batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Stock Units</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeds.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 font-mono">{m.batchNumber}</td>
                    <td className="py-3 px-4 font-black">{m.stockQuantity}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">₹{m.unitPrice}</td>
                    <td className="py-3 px-4">{new Date(m.expiryDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {m.isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          IN STOCK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ADD BATCH TAB */}
      {activeTab === 'add' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase">Add Medicine Batch</h2>
          <form onSubmit={handleAddMedicine} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol 650mg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Generic Composition / Formula
              </label>
              <input
                type="text"
                placeholder="e.g. Acetaminophen"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Batch Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="BATCH-009"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Units Received *
                </label>
                <input
                  type="number"
                  required
                  placeholder="100"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Unit Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="15.50"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition"
            >
              + Register Stock Batch
            </button>
          </form>
        </div>
      )}

      {/* PRINTABLE OFFICIAL PHARMACY GST INVOICE MODAL */}
      {invoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase">
                  Official Retail Pharmacy Tax Invoice
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">DRBLOOMEDI PHARMACY</h2>
              </div>
              <button
                onClick={() => setInvoiceModal(null)}
                className="w-7 h-7 bg-slate-100 rounded-full font-bold text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Patient Details
                </span>
                <p className="font-bold text-slate-900">{invoiceModal.patient?.fullName}</p>
                <p className="text-slate-500">Phone: {invoiceModal.patient?.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Invoice Details
                </span>
                <p className="font-mono font-bold text-slate-900">{invoiceModal.invoiceNumber}</p>
                <p className="text-slate-500">
                  {new Date(invoiceModal.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Dispensed Medicines ({invoiceModal.lineItems.length})
              </span>
              {invoiceModal.lineItems.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100"
                >
                  <span className="font-semibold text-slate-800">{item.itemDescription}</span>
                  <span className="font-bold text-slate-900">₹{Number(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sub Total:</span>
                <span className="font-bold">₹{invoiceModal.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hospital Pharmacy GST (5%):</span>
                <span className="font-bold">₹{invoiceModal.gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700">₹{invoiceModal.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-md"
              >
                <span>🖨️</span> Print Tax Receipt
              </button>
              <button
                type="button"
                onClick={() => setInvoiceModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}