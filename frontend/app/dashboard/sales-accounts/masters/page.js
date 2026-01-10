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
  <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    {error && (
      <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
        {error}
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1">
          <label className="text-xs text-slate-600">{f.label}</label>
          <input
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
        className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save'}
      </motion.button>
    </div>
    <div className="overflow-x-auto pt-1">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="text-left px-6 py-3 font-semibold">Name</th>
            <th className="text-left px-6 py-3 font-semibold">Email / GSTIN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={2} className="px-6 py-6 text-slate-400 text-center text-xs">
                Loading...
              </td>
            </tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-6 py-6 text-slate-400 text-center text-xs">
                No records.
              </td>
            </tr>
          ) : (
            list.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-900 font-medium">
                  {row.name || row.full_name || '-'}
                </td>
                <td className="px-6 py-4 text-slate-600">
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
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
          <span>Masters desk</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Masters</h1>
          <p className="text-sm text-slate-500">
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
