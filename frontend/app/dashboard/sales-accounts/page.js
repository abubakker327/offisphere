'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const tiles = [
  {
    title: 'Masters',
    desc: 'Products, Vendors, Customers, GST',
    href: '/dashboard/sales-accounts/masters',
    color: '#0fb472',
    icon: '🗂️'
  },
  {
    title: 'Procurement',
    desc: 'PO, GRN, Vendor Bills',
    href: '/dashboard/sales-accounts/procurement',
    color: '#f61b63',
    icon: '📦'
  },
  {
    title: 'Inventory',
    desc: 'Stock Ledger, Serials, Warehouses',
    href: '/dashboard/sales-accounts/inventory',
    color: '#1a7dff',
    icon: '📊'
  },
  {
    title: 'Sales',
    desc: 'Quotations, Orders, Delivery, Invoices',
    href: '/dashboard/sales-accounts/sales',
    color: '#f48c06',
    icon: '🧾'
  },
  {
    title: 'Payments',
    desc: 'Cash In (customers) & Out (vendors)',
    href: '/dashboard/sales-accounts/payments',
    color: '#00b3d8',
    icon: '💸'
  },
  {
    title: 'Accounting',
    desc: 'Ledger entries, Profit & Loss',
    href: '/dashboard/sales-accounts/accounting',
    color: '#7c4dff',
    icon: '📈'
  }
];

export default function SalesAccountsHome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -left-10 h-36 w-36 bg-indigo-400/20 blur-3xl" />
          <div className="absolute -bottom-12 right-2 h-32 w-32 bg-emerald-400/15 blur-3xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sales & Accounts</h1>
            <p className="text-sm text-slate-500">
              End-to-end cycle: masters, procurement, inventory, sales, payments, accounting.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg"
          >
            Live workflow map
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile, idx) => (
          <Link key={tile.href} href={tile.href} className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.25 }}
              whileHover={{
                rotateX: 2,
                rotateY: -2,
                y: -4,
                transformPerspective: 900,
                transition: { type: 'spring', stiffness: 140, damping: 16 }
              }}
              whileTap={{ scale: 0.99 }}
              className="tilt-card relative overflow-hidden rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.18)] p-6 border border-white/25 backdrop-blur-sm h-56"
              style={{ background: tile.color }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -left-6 top-3 h-36 w-36 rounded-full bg-white/12 blur-2xl" />
                <div className="absolute right-2 -bottom-10 h-32 w-32 rounded-full bg-white/18 blur-2xl" />
                <div className="absolute right-8 top-10 h-20 w-20 rounded-full bg-white/14 blur-xl" />
              </div>
              <div className="relative flex h-full flex-col justify-between text-white drop-shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold tracking-tight leading-none">{tile.title}</h3>
                    <p className="text-xs text-white/90 leading-snug max-w-xs">{tile.desc}</p>
                  </div>
                </div>
                <div className="flex justify-center pb-1">
                  <span className="text-[3.5rem] drop-shadow">{tile.icon}</span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
