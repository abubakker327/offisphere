'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const tiles = [
  {
    title: 'Masters',
    desc: 'Products, Vendors, Customers, GST',
    href: '/dashboard/sales-accounts/masters',
    accent: 'from-[#8d7bff] via-[#7ab2ff] to-[#c6d3ff]',
    emoji: '🗂️'
  },
  {
    title: 'Procurement',
    desc: 'PO, GRN, Vendor Bills',
    href: '/dashboard/sales-accounts/procurement',
    accent: 'from-[#7ad7c4] via-[#59c9a5] to-[#b8f3e1]',
    emoji: '📦'
  },
  {
    title: 'Inventory',
    desc: 'Stock Ledger, Serials, Warehouses',
    href: '/dashboard/sales-accounts/inventory',
    accent: 'from-[#8ad8ff] via-[#69b7ff] to-[#bde5ff]',
    emoji: '🏬'
  },
  {
    title: 'Sales',
    desc: 'Quotations, Orders, Delivery, Invoices',
    href: '/dashboard/sales-accounts/sales',
    accent: 'from-[#ff9fb2] via-[#f878a9] to-[#ffc7d9]',
    emoji: '🧾'
  },
  {
    title: 'Payments',
    desc: 'Cash In (customers) & Out (vendors)',
    href: '/dashboard/sales-accounts/payments',
    accent: 'from-[#7fd1ff] via-[#5fb3ff] to-[#b3e4ff]',
    emoji: '💸'
  },
  {
    title: 'Accounting',
    desc: 'Ledger entries, Profit & Loss',
    href: '/dashboard/sales-accounts/accounting',
    accent: 'from-[#96f2a9] via-[#6fdd8c] to-[#c4ffcf]',
    emoji: '📊'
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
          <motion.div
            key={tile.href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx, duration: 0.25 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="relative overflow-hidden rounded-3xl shadow-[0_16px_30px_rgba(0,0,0,0.12)] p-4"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.accent}`} />
            <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-10 top-4 h-40 w-40 rounded-full bg-white/12 blur-2xl" />
              <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/18 blur-2xl" />
            </div>
            <div className="relative flex flex-col gap-3 text-white drop-shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{tile.title}</h3>
                <span className="text-lg">{tile.emoji}</span>
              </div>
              <p className="text-xs text-white/90">{tile.desc}</p>
              <Link
                href={tile.href}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white hover:translate-x-0.5 transition-transform"
              >
                Open →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
