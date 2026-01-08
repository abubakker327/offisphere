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
      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiles.map((tile, idx) => (
          <Link key={tile.href} href={tile.href} className="block h-full group">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.25 }}
              whileHover="hover"
              variants={{
                hover: {
                  scale: 1.05,
                  transition: { duration: 0.3, ease: 'easeOut' }
                }
              }}
              whileTap={{ scale: 0.98 }}
              className="tilt-card relative overflow-hidden rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.18)] p-8 border border-white/20 backdrop-blur-md h-64 flex flex-col justify-between transition-shadow hover:shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
              style={{ 
                background: `linear-gradient(135deg, ${tile.color} 0%, ${tile.color}dd 100%)`,
              }}
            >
              {/* Corner highlight shape */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:translate-x-8 group-hover:-translate-y-8" />
              
              {/* Hover Arrow */}
              <motion.div
                variants={{
                  hover: { opacity: 1, x: 0 }
                }}
                initial={{ opacity: 0, x: -10 }}
                className="absolute top-7 right-7 z-30"
              >
                <svg 
                  width="28" 
                  height="28" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-white drop-shadow-sm"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </motion.div>

              <div className="absolute inset-0 pointer-events-none lg:opacity-60">
                <div className="absolute -left-6 top-3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute right-2 -bottom-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute right-8 top-10 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              </div>

              <div className="relative z-20 flex h-full flex-col justify-between text-white">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight leading-none drop-shadow-md">
                    {tile.title}
                  </h3>
                  <p className="text-sm text-white/80 leading-snug font-medium max-w-[200px]">
                    {tile.desc}
                  </p>
                </div>
                
                <div className="flex justify-center pb-2">
                  <motion.div 
                    variants={{
                      hover: { 
                        rotate: 15, 
                        scale: 1.2,
                        y: -8
                      }
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="relative w-32 h-32 flex items-center justify-center"
                  >
                    {/* Apple-style Glass Glow */}
                    <div className="absolute inset-0 bg-white/11 rounded-2xl blur-sm border border-white/20 backdrop-blur-xl" />
                    <div className="absolute inset-4 bg-white/5 rounded-xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)]" />
                    <span className="relative text-[4.5rem] select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                      {tile.icon}
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
