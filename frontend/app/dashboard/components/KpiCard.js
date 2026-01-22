"use client";

const renderIcon = (name, color) => {
  const base = "h-5 w-5";
  const props = {
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "check":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "user":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      );
    case "users":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "user-plus":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M22 11h-6" />
        </svg>
      );
    case "user-x":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m19 8 4 4" />
          <path d="m23 8-4 4" />
        </svg>
      );
    case "clock":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l3 3" />
        </svg>
      );
    case "leaf":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M20 4c-9 0-14 6-14 12 0 4 3 7 7 7 6 0 12-5 12-14 0 0-2 0-5-5Z" />
          <path d="M9 14c2 0 4 1 5 3" />
          <path d="M9 10c1.5 0 3 0.5 4 2" />
        </svg>
      );
    case "money":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M12 2v20" />
          <path d="M16.5 6.5c0-1.9-2-3.5-4.5-3.5S7.5 4.1 7.5 6s1.3 3 4.5 3 4.5 1.1 4.5 3-2 3.5-4.5 3.5-4.5-1.1-4.5-3" />
        </svg>
      );
    case "cash":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M7 10h.01M17 14h.01" />
        </svg>
      );
    case "alert":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      );
    case "list":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M9 6h12" />
          <path d="M9 12h12" />
          <path d="M9 18h12" />
          <path d="M5 6h.01" />
          <path d="M5 12h.01" />
          <path d="M5 18h.01" />
        </svg>
      );
    case "trend":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M3 17l6-6 4 4 7-7" />
          <path d="M14 8h7v7" />
        </svg>
      );
    case "percent":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M19 5 5 19" />
          <circle cx="6.5" cy="6.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      );
    case "trophy":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v4a5 5 0 0 1-10 0Z" />
          <path d="M5 5h2v3a4 4 0 0 1-4-4V3h2" />
          <path d="M19 5h2V3h2v1a4 4 0 0 1-4 4V5Z" />
        </svg>
      );
    case "target":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case "star":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7" />
        </svg>
      );
    case "inbox":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M4 4h16v12a2 2 0 0 1-2 2h-4l-2 3-2-3H6a2 2 0 0 1-2-2Z" />
          <path d="M4 13h4l2 3h4l2-3h4" />
        </svg>
      );
    case "outbox":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M4 4h16v12a2 2 0 0 1-2 2h-4l-2 3-2-3H6a2 2 0 0 1-2-2Z" />
          <path d="M12 9v6" />
          <path d="m8 11 4-4 4 4" />
        </svg>
      );
    case "receipt":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M7 2h10v20l-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M9 6h6" />
          <path d="M9 10h6" />
          <path d="M9 14h6" />
        </svg>
      );
    case "flame":
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2.5 2-5 4-8Z" />
          <path d="M9 14a3 3 0 0 0 6 0" />
        </svg>
      );
    default:
      return (
        <svg className={base} viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
};

export const KpiCard = ({ label, value, loading, icon, accent, hint }) => (
  <div
    className="relative flex items-center justify-between rounded-2xl bg-white border border-slate-100 shadow-[0_16px_36px_rgba(15,23,42,0.08)] p-4 border-l-4"
    style={{ borderLeftColor: accent }}
  >
    <div className="min-w-0 pr-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">
        {loading ? "--" : value}
      </p>
      {hint && (
        <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
      )}
    </div>
    <div
      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-slate-100"
      style={{ color: accent }}
    >
      {renderIcon(icon, accent)}
    </div>
  </div>
);
