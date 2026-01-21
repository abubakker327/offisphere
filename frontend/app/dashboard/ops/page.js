"use client";

import SectionCards from "../components/SectionCards";

const tiles = [
  {
    title: "Devices",
    desc: "Assets, ownership, health",
    href: "/dashboard/devices",
    color: "#1a7dff",
    iconSrc: "/icons/devices-material.svg",
  },
  {
    title: "Documents",
    desc: "Files, policies, templates",
    href: "/dashboard/documents",
    color: "#7c4dff",
    iconSrc: "/icons/documents-material.svg",
  },
  {
    title: "Reimbursements",
    desc: "Claims, approvals, payouts",
    href: "/dashboard/reimbursements",
    color: "#f61b63",
    iconSrc: "/icons/reimbursements-material.svg",
  },
];

export default function OpsOverview() {
  return (
    <SectionCards
      title="Assets & Operations"
      description="Track company assets, manage documents, and close reimbursements."
      pill="Operations"
      tiles={tiles}
    />
  );
}
