'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProductsPage from './products/page';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

const fetchWithAuth = async (path, options = {}) => {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('offisphere_token')
      : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
};

const EntityCard = ({ title, description, list, fields, onSubmit, loading, saving, error }) => (
  <div className="relative overflow-hidden rounded-2xl border border-indigo-100/60 bg-white/90 shadow-[0_14px_36px_rgba(0,0,0,0.06)] p-4 space-y-3 backdrop-blur">
    <div
      className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
      aria-hidden="true"
    />
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
          {title}
        </h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    {error && (
      <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
        {error}
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1">
          <label className="text-[11px] text-slate-500">{f.label}</label>
          <input
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder={f.placeholder}
          />
        </div>
      ))}
    </div>
    <div className="flex justify-end pt-1">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={saving}
        onClick={onSubmit}
        className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:shadow-lg disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save'}
      </motion.button>
    </div>
    <div className="overflow-x-auto text-xs pt-1">
      <table className="min-w-full border-separate border-spacing-y-1">
        <thead className="text-[11px] text-white">
          <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
            <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">Name</th>
            <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Email / GSTIN</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={2} className="px-2 py-3 text-slate-400 text-center">
                Loading…
              </td>
            </tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-2 py-3 text-slate-400 text-center">
                No records.
              </td>
            </tr>
          ) : (
            list.map((row, idx) => (
              <tr 
                key={row.id} 
                className={`rounded shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}
              >
                <td className="px-2 py-2 text-slate-900 font-medium">{row.name || row.full_name || '-'}</td>
                <td className="px-2 py-2 text-slate-600">
                  {row.email || row.gstin || row.phone || '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default function MastersPage() {
  // Vendors
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorError, setVendorError] = useState('');
  const [savingVendor, setSavingVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: '', email: '', gstin: '' });

  // Customers
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', gstin: '' });

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const data = await fetchWithAuth('/api/sa/masters/vendors');
      setVendors(Array.isArray(data) ? data : []);
      setVendorError('');
    } catch (err) {
      setVendorError(err.message || 'Error loading vendors');
    } finally {
      setLoadingVendors(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const data = await fetchWithAuth('/api/sa/masters/customers');
      setCustomers(Array.isArray(data) ? data : []);
      setCustomerError('');
    } catch (err) {
      setCustomerError(err.message || 'Error loading customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    loadVendors();
    loadCustomers();
  }, []);

  const saveVendor = async () => {
    try {
      setSavingVendor(true);
      await fetchWithAuth('/api/sa/masters/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorForm)
      });
      setVendorForm({ name: '', email: '', gstin: '' });
      loadVendors();
    } catch (err) {
      setVendorError(err.message || 'Error saving vendor');
    } finally {
      setSavingVendor(false);
    }
  };

  const saveCustomer = async () => {
    try {
      setSavingCustomer(true);
      await fetchWithAuth('/api/sa/masters/customers', {
        method: 'POST',
        body: JSON.stringify(customerForm)
      });
      setCustomerForm({ name: '', email: '', gstin: '' });
      loadCustomers();
    } catch (err) {
      setCustomerError(err.message || 'Error saving customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          <span>Masters desk</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Masters</h1>
          <p className="text-sm text-slate-600">
            Manage products, vendors, customers, and GST slabs.
          </p>
        </div>
      </div>

      <ProductsPage />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EntityCard
          title="Vendors"
          description="Suppliers with GSTIN"
          list={vendors}
          loading={loadingVendors}
          saving={savingVendor}
          error={vendorError}
          fields={[
            {
              name: 'name',
              label: 'Name',
              value: vendorForm.name,
              placeholder: 'Vendor name',
              onChange: (v) => setVendorForm((p) => ({ ...p, name: v }))
            },
            {
              name: 'email',
              label: 'Email',
              value: vendorForm.email,
              placeholder: 'vendor@email',
              onChange: (v) => setVendorForm((p) => ({ ...p, email: v }))
            },
            {
              name: 'gstin',
              label: 'GSTIN',
              value: vendorForm.gstin,
              placeholder: 'GSTIN',
              onChange: (v) => setVendorForm((p) => ({ ...p, gstin: v }))
            }
          ]}
          onSubmit={saveVendor}
        />

        <EntityCard
          title="Customers"
          description="Schools / institutions"
          list={customers}
          loading={loadingCustomers}
          saving={savingCustomer}
          error={customerError}
          fields={[
            {
              name: 'name',
              label: 'Name',
              value: customerForm.name,
              placeholder: 'Customer name',
              onChange: (v) => setCustomerForm((p) => ({ ...p, name: v }))
            },
            {
              name: 'email',
              label: 'Email',
              value: customerForm.email,
              placeholder: 'customer@email',
              onChange: (v) => setCustomerForm((p) => ({ ...p, email: v }))
            },
            {
              name: 'gstin',
              label: 'GSTIN',
              value: customerForm.gstin,
              placeholder: 'GSTIN',
              onChange: (v) => setCustomerForm((p) => ({ ...p, gstin: v }))
            }
          ]}
          onSubmit={saveCustomer}
        />
      </div>
    </motion.div>
  );
}
