"use client";

import { useEffect, useMemo, useState } from "react";
import SectionCards from "../components/SectionCards";
import { KpiCard } from "../components/KpiCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

const tiles = [
  {
    title: "Leads",
    desc: "Pipeline, follow-ups, status",
    href: "/dashboard/leads",
    color: "#f61b63",
    iconSrc: "/icons/leads-material.svg",
  },
  {
    title: "Payments",
    desc: "Invoices, collections, receipts",
    href: "/dashboard/payments",
    color: "#00b3d8",
    iconSrc: "/icons/payments-material.svg",
  },
  {
    title: "Sales Reports",
    desc: "Forecasts and performance",
    href: "/dashboard/sales-reports",
    color: "#7c4dff",
    iconSrc: "/icons/sales-reports-material.svg",
  },
];

export default function SalesOverview() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/leads?status=all`, {
          credentials: "include",
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeads(data);
        }
      } catch (err) {
        console.error("Sales overview leads error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const {
    pipelineValue,
    leadsLast7,
    leadsLast30,
    wonThisMonth,
    conversionRate,
  } = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const isInCurrentMonth = (value) => {
      if (!value) return false;
      const date = new Date(value);
      return `${date.getFullYear()}-${date.getMonth()}` === monthKey;
    };
    const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

    let pipeline = 0;
    let last7 = 0;
    let last30 = 0;
    let wonCount = 0;
    let totalCount = leads.length;

    leads.forEach((lead) => {
      const stage = (lead.stage || "").toLowerCase();
      const createdAt = lead.created_at ? new Date(lead.created_at) : null;

      if (stage !== "cold") {
        pipeline += Number(lead.expected_value || 0);
      }

      if (createdAt && createdAt >= daysAgo(7)) {
        last7 += 1;
      }
      if (createdAt && createdAt >= daysAgo(30)) {
        last30 += 1;
      }

      if (lead.status === "won" && isInCurrentMonth(lead.created_at)) {
        wonCount += 1;
      }
    });

    const conversion =
      totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;

    return {
      pipelineValue: pipeline,
      leadsLast7: last7,
      leadsLast30: last30,
      wonThisMonth: wonCount,
      conversionRate: conversion,
    };
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Pipeline value"
          value={`INR ${Number(pipelineValue || 0).toLocaleString("en-IN")}`}
          loading={loading}
          icon="trend"
          accent="#0ea5e9"
        />
        <KpiCard
          label="New leads (7/30d)"
          value={`${leadsLast7}/${leadsLast30}`}
          loading={loading}
          icon="user-plus"
          accent="#6366f1"
        />
        <KpiCard
          label="Won this month"
          value={wonThisMonth}
          loading={loading}
          icon="trophy"
          accent="#10b981"
        />
        <KpiCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          loading={loading}
          icon="percent"
          accent="#f59e0b"
        />
      </div>

      <SectionCards
        title="Sales & CRM"
        description="Manage leads, track revenue, and report performance."
        pill="Revenue ops"
        tiles={tiles}
      />
    </div>
  );
}
