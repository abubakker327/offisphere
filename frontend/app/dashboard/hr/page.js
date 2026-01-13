'use client';

import SectionCards from '../components/SectionCards';

const tiles = [
  {
    title: 'Users',
    desc: 'Admins, managers, employees',
    href: '/dashboard/users',
    color: '#1a7dff',
    iconSrc: '/icons/users-material.svg'
  },
  {
    title: 'Attendance',
    desc: 'Check-ins, shifts, presence',
    href: '/dashboard/attendance',
    color: '#00b3d8',
    iconSrc: '/icons/attendance-material.svg'
  },
  {
    title: 'Timesheets',
    desc: 'Hours, approvals, summaries',
    href: '/dashboard/timesheets',
    color: '#7c4dff',
    iconSrc: '/icons/timesheets-material.svg'
  },
  {
    title: 'Leaves',
    desc: 'Requests, balances, policies',
    href: '/dashboard/leaves',
    color: '#0fb472',
    iconSrc: '/icons/leaves-material.svg'
  },
  {
    title: 'Tasks',
    desc: 'Assignments and tracking',
    href: '/dashboard/tasks',
    color: '#f48c06',
    iconSrc: '/icons/tasks-material.svg'
  }
];

export default function HrOverview() {
  return (
    <SectionCards
      title="HR Management"
      description="People ops, attendance, and daily tasks in one place."
      pill="Team hub"
      tiles={tiles}
    />
  );
}
