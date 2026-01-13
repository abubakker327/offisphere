'use client';

import SectionCards from '../components/SectionCards';

const tiles = [
  {
    title: 'Payroll',
    desc: 'Salary cycles and payouts',
    href: '/dashboard/payroll',
    color: '#1a7dff',
    iconSrc: '/icons/payroll-material.svg'
  },
  {
    title: 'Recognition',
    desc: 'Rewards and appreciation',
    href: '/dashboard/recognition',
    color: '#f48c06',
    iconSrc: '/icons/recognition-material.svg'
  },
  {
    title: 'Email',
    desc: 'Templates and campaigns',
    href: '/dashboard/email',
    color: '#7c4dff',
    iconSrc: '/icons/email-material.svg'
  },
  {
    title: 'Exports',
    desc: 'Downloads and exports',
    href: '/dashboard/exports',
    color: '#00b3d8',
    iconSrc: '/icons/exports-material.svg'
  },
  {
    title: 'Reports',
    desc: 'Finance and compliance',
    href: '/dashboard/reports',
    color: '#0fb472',
    iconSrc: '/icons/reports-material.svg'
  }
];

export default function FinanceOverview() {
  return (
    <SectionCards
      title="Finance & Admin"
      description="Payroll, recognition, reporting, and exports in one hub."
      pill="Finance"
      tiles={tiles}
    />
  );
}
