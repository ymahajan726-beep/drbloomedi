'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

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
  const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'counter' | 'inventory' | 'add'>('counter');
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

      const [selectedPatientId, setSelectedPatientId] = useState('');
      const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [dispensing, setDispensing] = useState(false);


  const [invoiceModal, setInvoiceModal] = useState<any | null>(null);

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

  const handleAddToCart = () => {
    if (!selectedMedId) {
      showToast('Please select a medicine', 'error');
      return;
    }
    const med = medicines.find((m) => m.id === selectedMedId);
    if (!med) return;

    const qty = parseInt(selectedQty, 10) || 1;
    if (qty <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }

    if (qty > med.stockQuantity) {
      showToast(`Only ${med.stockQuantity} units available in stock`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.medicine.id === med.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + qty;
      if (newQty > med.stockQuantity) {
        showToast(`Cannot add more. Maximum available stock is ${med.stockQuantity}`, 'error');
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


  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.medicine.id !== id));
  };

  
  const handleProcessSale = async () => {
    if (!selectedPatientId) {
      showToast('Please select a patient for pharmacy billing', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Please add at least one medicine to the cart', 'error');
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
      showToast(`Sales Dispense Error: ${err.message}`, 'error');
    } finally {
      setDispensing(false);
    }
  };

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
      showToast('Medicine stock added successfully!', 'success');

      setName('');
      setGenericName('');
      setBatchNumber('');
      setStockQuantity('');
      setUnitPrice('');
      setExpiryDate('');

      await loadPharmacyData();
      setActiveTab('counter');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

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

  const field =
    'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 transition';

  return (
    <div className="min-h-screen bg-[#F4F7F6] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            PHA
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              Hospital Pharmacy & Store
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Multi-Medicine Dispense Counter, Live Stock Management & GST Invoicing[cite: 1]
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            ['counter', `🛒 Dispense Counter (${cart.length})`],
            ['inventory', '📦 Stock Inventory'],
            ['add', '+ Add Medicine Batch'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === key
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {activeTab === 'counter' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Dispense Multi-Medicine Cart
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Select Patient *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className={field}
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
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Choose Medicine ({medicines.length} in stock)
                    </label>
                    <select
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                      className={field}
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
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      className={field}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer shadow-2xs"
                >
                  + Add To Patient Bill Cart
                </button>
              </div>

              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Cart Items ({cart.length})
                </h3>
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center font-medium">
                    Cart is empty. Select medicines above to add multiple items.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {cart.map((item) => (
                      <div key={item.medicine.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.medicine.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            ₹{item.medicine.unitPrice} × {item.quantity} units (Batch: {item.medicine.batchNumber})
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            ₹{(item.medicine.unitPrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item.medicine.id)}
                            className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold border border-rose-200 dark:border-rose-900 flex items-center justify-center cursor-pointer"
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

           
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  Pharmacy Tax Invoice
                </h2>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Items in Cart:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{cart.length} Medicines</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Sub Total:</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">₹{cartSubTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>GST (5%):</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">₹{cartGst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 font-mono">
                    <span>Grand Total:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={dispensing || cart.length === 0 || !selectedPatientId}
                onClick={handleProcessSale}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                {dispensing ? 'Generating GST Invoice...' : '✓ Dispense & Settle Bill'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <input
              type="text"
              placeholder="Search by Medicine Name, Generic Name or Batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-600 transition"
            />

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Medicine Name</th>
                    <th className="py-2.5 px-3">Batch No</th>
                    <th className="py-2.5 px-3">Stock Units</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3 text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredMeds.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{m.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{m.batchNumber}</td>
                      <td className="py-3 px-3 font-bold font-mono text-slate-900 dark:text-white">{m.stockQuantity}</td>
                      <td className="py-3 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{m.unitPrice}</td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{new Date(m.expiryDate).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-right">
                        {m.isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
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

        {activeTab === 'add' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs max-w-xl mx-auto space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Add Medicine Batch
            </h2>
            <form onSubmit={handleAddMedicine} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Generic Composition / Formula
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acetaminophen"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className={field}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH-009"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Units Received *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className={field}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="15.50"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={field}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                + Register Stock Batch
              </button>
            </form>
          </div>
        )}
      </main>

      {invoiceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded uppercase">
                  Official Retail Pharmacy Tax Invoice
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">DRBLOOMEDI PHARMACY</h2>
              </div>
              <button
                onClick={() => setInvoiceModal(null)}
                className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Patient Details
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{invoiceModal.patient?.fullName}</p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Phone: {invoiceModal.patient?.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Invoice Details
                </span>
                <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{invoiceModal.invoiceNumber}</p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
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
                  className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs border border-slate-200/60 dark:border-slate-700"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.itemDescription}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">₹{Number(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-medium">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Sub Total:</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">₹{invoiceModal.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Hospital Pharmacy GST (5%):</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">₹{invoiceModal.gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700 font-mono">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₹{invoiceModal.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>🖨️</span> Print Tax Receipt
              </button>
              <button
                type="button"
                onClick={() => setInvoiceModal(null)}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
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