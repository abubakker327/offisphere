'use client';

import SectionCards from '../components/SectionCards';

const tiles = [
  {
    title: 'Leads',
    desc: 'Pipeline, follow-ups, status',
    href: '/dashboard/leads',
    color: '#f61b63',
    iconSrc: '/icons/leads-material.svg'
  },
  {
    title: 'Payments',
    desc: 'Invoices, collections, receipts',
    href: '/dashboard/payments',
    color: '#00b3d8',
    iconSrc: '/icons/payments-material.svg'
  },
  {
    title: 'Sales Reports',
    desc: 'Forecasts and performance',
    href: '/dashboard/sales-reports',
    color: '#7c4dff',
    iconSrc: '/icons/sales-reports-material.svg'
  }
];

export default function SalesOverview() {
  return (
    <SectionCards
      title="Sales & CRM"
      description="Manage leads, track revenue, and report performance."
      pill="Revenue ops"
      tiles={tiles}
    />
  );
}
