'use client';

import { useEffect, useState } from 'react';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '',
    device_type: '',
    serial_number: '',
    status: 'available',
    assigned_to: '',
    notes: ''
  });

  const [editingDevice, setEditingDevice] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    device_type: '',
    serial_number: '',
    status: 'available',
    assigned_to: '',
    notes: ''
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = window.localStorage.getItem('offisphere_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // devices
        const devRes = await fetch(`${API_BASE}/api/devices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const devData = await devRes.json();

        if (!devRes.ok) {
          setError(devData.message || 'Error fetching devices');
        } else {
          setDevices(devData);
          setError('');
        }

        // users (for assign dropdown)
        const usersRes = await fetch(`${API_BASE}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();

        if (usersRes.ok && Array.isArray(usersData)) {
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Devices fetch error:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFormChange = (field, value, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, [field]: value }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setCreateError('Not authenticated');
        setCreating(false);
        return;
      }

      const payload = {
        ...form,
        assigned_to: form.assigned_to || null
      };

      const res = await fetch(`${API_BASE}/api/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.message || 'Error creating device');
        setCreating(false);
        return;
      }

      setDevices(data);
      setForm({
        name: '',
        device_type: '',
        serial_number: '',
        status: 'available',
        assigned_to: '',
        notes: ''
      });
      setCreateError('');
    } catch (err) {
      console.error('Create device error:', err);
      setCreateError('Error connecting to server');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (device) => {
    setEditingDevice(device);
    setEditError('');
    setEditForm({
      name: device.name || '',
      device_type: device.device_type || '',
      serial_number: device.serial_number || '',
      status: device.status || 'available',
      assigned_to: device.assigned_to || '',
      notes: device.notes || ''
    });
  };

  const closeEdit = () => {
    setEditingDevice(null);
    setEditError('');
    setEditSaving(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDevice) return;

    setEditSaving(true);
    setEditError('');

    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setEditError('Not authenticated');
        setEditSaving(false);
        return;
      }

      const payload = {
        ...editForm,
        assigned_to: editForm.assigned_to || null
      };

      const res = await fetch(
        `${API_BASE}/api/devices/${editingDevice.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.message || 'Error updating device');
        setEditSaving(false);
        return;
      }

      setDevices(data);
      closeEdit();
    } catch (err) {
      console.error('Update device error:', err);
      setEditError('Error connecting to server');
      setEditSaving(false);
    }
  };

  const statusBadge = (status) => {
    const base =
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border';
    switch (status) {
      case 'available':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'assigned':
        return `${base} bg-sky-50 text-sky-700 border-sky-200`;
      case 'repair':
        return `${base} bg-amber-50 text-amber-700 border-amber-200`;
      case 'retired':
        return `${base} bg-slate-100 text-slate-600 border-slate-200`;
      default:
        return `${base} bg-slate-50 text-slate-600 border-slate-200`;
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Devices
        </h1>
        <p className="text-sm text-slate-500">
          Track company laptops, phones and other equipment.
        </p>
      </div>

      {/* Create device */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Add new device
        </h2>

        {createError && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {createError}
          </div>
        )}

        <form
          onSubmit={handleCreateDevice}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                handleFormChange('name', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Dell XPS 13, iPhone 14..."
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              Device type
            </label>
            <input
              type="text"
              value={form.device_type}
              onChange={(e) =>
                handleFormChange('device_type', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Laptop, Phone, Monitor"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              Serial number
            </label>
            <input
              type="text"
              value={form.serial_number}
              onChange={(e) =>
                handleFormChange('serial_number', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Assign to</label>
            <select
              value={form.assigned_to}
              onChange={(e) =>
                handleFormChange('assigned_to', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-xs text-slate-600">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                handleFormChange('notes', e.target.value)
              }
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs resize-none"
              placeholder="Add purchase date, condition, accessories, etc."
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:opacity-90 disabled:opacity-60"
            >
              {creating ? 'Saving...' : 'Add device'}
            </button>
          </div>
        </form>
      </div>

      {/* Devices table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Devices inventory
        </h2>

        {error && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Name</th>
                <th className="text-left px-3 py-1">Type</th>
                <th className="text-left px-3 py-1">Serial</th>
                <th className="text-left px-3 py-1">Assigned to</th>
                <th className="text-left px-3 py-1">Assigned at</th>
                <th className="text-left px-3 py-1">Status</th>
                <th className="text-right px-3 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading devices...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No devices found.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr
                    key={d.id}
                    className="bg-slate-50 hover:bg-slate-100 rounded-xl"
                  >
                    <td className="px-3 py-3 rounded-l-xl text-slate-900">
                      {d.name}
                      {d.notes && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {d.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {d.device_type || '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {d.serial_number || '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {d.assigned_to_name || 'Unassigned'}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatDateTime(d.assigned_at)}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className={statusBadge(d.status)}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 rounded-r-xl text-right text-xs">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="px-4 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Edit device
              </h3>
              <button
                type="button"
                onClick={closeEdit}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {editError}
              </div>
            )}

            <form
              onSubmit={handleSaveEdit}
              className="space-y-3 text-sm"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    handleFormChange('name', e.target.value, true)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Device type
                </label>
                <input
                  type="text"
                  value={editForm.device_type}
                  onChange={(e) =>
                    handleFormChange(
                      'device_type',
                      e.target.value,
                      true
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Serial number
                </label>
                <input
                  type="text"
                  value={editForm.serial_number}
                  onChange={(e) =>
                    handleFormChange(
                      'serial_number',
                      e.target.value,
                      true
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    handleFormChange('status', e.target.value, true)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                >
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="repair">Repair</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Assign to
                </label>
                <select
                  value={editForm.assigned_to || ''}
                  onChange={(e) =>
                    handleFormChange(
                      'assigned_to',
                      e.target.value,
                      true
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    handleFormChange('notes', e.target.value, true)
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-60"
                >
                  {editSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
