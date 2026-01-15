'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://offisphere.onrender.com';

const featureIndex = [
  { label: 'Dashboard', href: '/dashboard', keywords: 'home overview' },
  { label: 'HR Management', href: '/dashboard/hr', keywords: 'people overview' },
  { label: 'Assets & Operations', href: '/dashboard/ops', keywords: 'devices overview' },
  { label: 'Sales & CRM', href: '/dashboard/sales', keywords: 'pipeline overview' },
  { label: 'Sales & Accounts', href: '/dashboard/sales-accounts', keywords: 'finance overview' },
  { label: 'Finance & Admin', href: '/dashboard/finance', keywords: 'payroll overview' },
  { label: 'Users', href: '/dashboard/users', keywords: 'people employees' },
  { label: 'Attendance', href: '/dashboard/attendance', keywords: 'check-in' },
  { label: 'Timesheets', href: '/dashboard/timesheets', keywords: 'hours time' },
  { label: 'Leaves', href: '/dashboard/leaves', keywords: 'vacation time off' },
  { label: 'Tasks', href: '/dashboard/tasks', keywords: 'work items' },
  { label: 'Devices', href: '/dashboard/devices', keywords: 'assets hardware' },
  { label: 'Documents', href: '/dashboard/documents', keywords: 'files library' },
  { label: 'Reimbursements', href: '/dashboard/reimbursements', keywords: 'claims' },
  { label: 'Leads', href: '/dashboard/leads', keywords: 'sales prospects' },
  { label: 'Payments', href: '/dashboard/payments', keywords: 'transactions' },
  { label: 'Sales Reports', href: '/dashboard/sales-reports', keywords: 'pipeline' },
  { label: 'Payroll', href: '/dashboard/payroll', keywords: 'salary' },
  { label: 'Recognition', href: '/dashboard/recognition', keywords: 'rewards' },
  { label: 'Email', href: '/dashboard/email', keywords: 'templates' },
  { label: 'Exports', href: '/dashboard/exports', keywords: 'reports' },
  { label: 'Reports', href: '/dashboard/reports', keywords: 'analytics' }
];

export default function GlobalSearch({ className = '' }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    features: [],
    users: [],
    devices: []
  });
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [searchError, setSearchError] = useState('');
  const [usersCache, setUsersCache] = useState(null);
  const [devicesCache, setDevicesCache] = useState(null);

  const normalize = (value) => String(value || '').toLowerCase();

  const filterFeatures = (query) => {
    const q = normalize(query);
    return featureIndex
      .filter((item) => {
        const haystack = `${item.label} ${item.keywords || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 6);
  };

  const filterUsers = (query, users) => {
    const q = normalize(query);
    return (users || [])
      .filter((user) => {
        const haystack = `${user.full_name || ''} ${user.email || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 5);
  };

  const filterDevices = (query, devices) => {
    const q = normalize(query);
    return (devices || [])
      .filter((device) => {
        const haystack = `${device.name || ''} ${device.device_type || ''} ${device.serial_number || ''} ${device.assigned_to_name || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 5);
  };

  const runSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults({ features: [], users: [], devices: [] });
      setSearchOpen(false);
      setActiveResultIndex(-1);
      setSearchError('');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    try {
      let users = usersCache;
      let devices = devicesCache;

      const fetches = [];
      if (!users) {
        fetches.push(
          fetch(`${API_BASE}/api/users`, {
        credentials: 'include',
          }).then((res) => res.json().then((data) => ({ res, data, type: 'users' })))
        );
      }
      if (!devices) {
        fetches.push(
          fetch(`${API_BASE}/api/devices`, {
        credentials: 'include',
          }).then((res) => res.json().then((data) => ({ res, data, type: 'devices' })))
        );
      }

      if (fetches.length > 0) {
        const responses = await Promise.all(fetches);
        responses.forEach(({ res, data, type }) => {
          if (!res.ok) return;
          if (type === 'users') users = Array.isArray(data) ? data : [];
          if (type === 'devices') devices = Array.isArray(data) ? data : [];
        });
      }

      if (!users) users = [];
      if (!devices) devices = [];

      setUsersCache(users);
      setDevicesCache(devices);

      const nextResults = {
        features: filterFeatures(trimmed),
        users: filterUsers(trimmed, users),
        devices: filterDevices(trimmed, devices)
      };

      setSearchResults(nextResults);
      setActiveResultIndex(-1);
      setSearchOpen(true);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Error searching');
      setSearchResults({ features: [], users: [], devices: [] });
      setActiveResultIndex(-1);
      setSearchOpen(true);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      runSearch(searchQuery);
    }, 200);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleSearchSelect = (href) => {
    if (!href) return;
    setSearchOpen(false);
    setSearchQuery('');
    setActiveResultIndex(-1);
    router.push(href);
  };

  const getTopResult = () => {
    if (searchResults.features[0]) return searchResults.features[0].href;
    if (searchResults.users[0]) return '/dashboard/users';
    if (searchResults.devices[0]) return '/dashboard/devices';
    return '';
  };

  const getFlatResults = () => {
    const items = [];
    searchResults.features.forEach((item) =>
      items.push({
        type: 'feature',
        label: item.label,
        href: item.href
      })
    );
    searchResults.users.forEach((user) =>
      items.push({
        type: 'user',
        label: user.full_name || user.email,
        meta: user.full_name && user.email ? user.email : '',
        href: '/dashboard/users'
      })
    );
    searchResults.devices.forEach((device) =>
      items.push({
        type: 'device',
        label: device.name || 'Device',
        meta: device.serial_number || '',
        href: '/dashboard/devices'
      })
    );
    return items;
  };

  return (
    <div className={className}>
      <div className="relative w-full">
        <label className="sr-only" htmlFor="global-search">
          Search
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <input
          id="global-search"
          type="text"
          placeholder="Search features, people, or docs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim()) setSearchOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setSearchOpen(false), 150);
          }}
          onKeyDown={(e) => {
            const flat = getFlatResults();
            if (e.key === 'Enter') {
              const href =
                activeResultIndex >= 0 && flat[activeResultIndex]
                  ? flat[activeResultIndex].href
                  : getTopResult();
              if (href) {
                e.preventDefault();
                handleSearchSelect(href);
              }
            } else if (e.key === 'ArrowDown') {
              if (!searchOpen) setSearchOpen(true);
              e.preventDefault();
              setActiveResultIndex((prev) =>
                Math.min(prev + 1, flat.length - 1)
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveResultIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Escape') {
              setSearchOpen(false);
              setActiveResultIndex(-1);
            }
          }}
          className="w-full rounded-full border border-slate-200 bg-white pl-11 pr-10 py-2 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {searchQuery && (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              setSearchQuery('');
              setSearchResults({ features: [], users: [], devices: [] });
              setSearchOpen(false);
              setActiveResultIndex(-1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {searchOpen && (
          <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-200 bg-white shadow-lg p-2 z-30">
            {searchLoading && (
              <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>
            )}
            {searchError && !searchLoading && (
              <div className="px-3 py-2 text-xs text-rose-600">{searchError}</div>
            )}
            {!searchLoading && !searchError && (
              <>
                {searchResults.features.length > 0 && (
                  <div className="space-y-1">
                    <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Features
                    </p>
                    {searchResults.features.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onMouseDown={() => handleSearchSelect(item.href)}
                        onMouseEnter={() => {
                          const idx = getFlatResults().findIndex(
                            (result) => result.href === item.href && result.type === 'feature'
                          );
                          setActiveResultIndex(idx);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100 ${
                          getFlatResults()[activeResultIndex]?.href === item.href &&
                          getFlatResults()[activeResultIndex]?.type === 'feature'
                            ? 'bg-slate-100'
                            : ''
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.users.length > 0 && (
                  <div className="space-y-1">
                    <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Users
                    </p>
                    {searchResults.users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={() => handleSearchSelect('/dashboard/users')}
                        onMouseEnter={() => {
                          const idx = getFlatResults().findIndex(
                            (result) => result.type === 'user' && result.label === (user.full_name || user.email)
                          );
                          setActiveResultIndex(idx);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100 ${
                          getFlatResults()[activeResultIndex]?.type === 'user' &&
                          getFlatResults()[activeResultIndex]?.label === (user.full_name || user.email)
                            ? 'bg-slate-100'
                            : ''
                        }`}
                      >
                        <span className="font-medium">{user.full_name || user.email}</span>
                        {user.full_name && user.email && (
                          <span className="text-xs text-slate-400"> · {user.email}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.devices.length > 0 && (
                  <div className="space-y-1">
                    <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Devices
                    </p>
                    {searchResults.devices.map((device) => (
                      <button
                        key={device.id}
                        type="button"
                        onMouseDown={() => handleSearchSelect('/dashboard/devices')}
                        onMouseEnter={() => {
                          const idx = getFlatResults().findIndex(
                            (result) => result.type === 'device' && result.label === (device.name || 'Device')
                          );
                          setActiveResultIndex(idx);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100 ${
                          getFlatResults()[activeResultIndex]?.type === 'device' &&
                          getFlatResults()[activeResultIndex]?.label === (device.name || 'Device')
                            ? 'bg-slate-100'
                            : ''
                        }`}
                      >
                        <span className="font-medium">{device.name || 'Device'}</span>
                        {device.serial_number && (
                          <span className="text-xs text-slate-400"> · {device.serial_number}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.features.length === 0 &&
                  searchResults.users.length === 0 &&
                  searchResults.devices.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500">
                      No results found.
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




