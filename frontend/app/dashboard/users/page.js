'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    roles: ['employee']
  });

  // EDIT state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    is_active: true,
    roles: ['employee']
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = window.localStorage.getItem('offisphere_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const res = await fetch('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Error fetching users');
          setLoading(false);
          return;
        }

        setUsers(data);
        setError('');
      } catch (err) {
        console.error('Users fetch error:', err);
        setError('Error fetching users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // --------- helpers ---------
  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  const renderRoles = (roles = []) => {
    if (!roles || roles.length === 0) {
      return <span className="text-xs text-slate-400">—</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {roles.includes('admin') && (
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs border border-indigo-100">
            Admin
          </span>
        )}
        {roles.includes('manager') && (
          <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs border border-sky-100">
            Manager
          </span>
        )}
        {roles.includes('employee') && (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
            Employee
          </span>
        )}
        {roles
          .filter(
            (r) =>
              !['admin', 'manager', 'employee'].includes(r)
          )
          .map((r) => (
            <span
              key={r}
              className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200"
            >
              {r}
            </span>
          ))}
      </div>
    );
  };

  const renderStatus = (isActive) => {
    const active = isActive !== false;
    return (
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            active ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        />
        <span className={active ? 'text-emerald-600' : 'text-slate-500'}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
    );
  };

  // --------- create user ---------
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRoleCreate = (role) => {
    setForm((prev) => {
      const exists = prev.roles.includes(role);
      if (exists) {
        const next = prev.roles.filter((r) => r !== role);
        return { ...prev, roles: next.length ? next : ['employee'] };
      }
      return { ...prev, roles: [...prev.roles, role] };
    });
  };

  const handleCreateUser = async (e) => {
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

      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.message || 'Error creating user');
        setCreating(false);
        return;
      }

      setUsers(data);
      setForm({
        full_name: '',
        email: '',
        password: '',
        roles: ['employee']
      });
      setCreateError('');
    } catch (err) {
      console.error('Create user error:', err);
      setCreateError('Error creating user');
    } finally {
      setCreating(false);
    }
  };

  // --------- edit user ---------
  const openEdit = (user) => {
    setEditingUser(user);
    setEditError('');
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      is_active: user.is_active !== false,
      roles:
        Array.isArray(user.roles) && user.roles.length
          ? user.roles
          : ['employee']
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditError('');
    setEditSaving(false);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRoleEdit = (role) => {
    setEditForm((prev) => {
      const exists = prev.roles.includes(role);
      if (exists) {
        const next = prev.roles.filter((r) => r !== role);
        return { ...prev, roles: next.length ? next : ['employee'] };
      }
      return { ...prev, roles: [...prev.roles, role] };
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditSaving(true);
    setEditError('');

    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setEditError('Not authenticated');
        setEditSaving(false);
        return;
      }

      const res = await fetch(
        `http://localhost:5000/api/users/${editingUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(editForm)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.message || 'Error updating user');
        setEditSaving(false);
        return;
      }

      setUsers(data);
      closeEdit();
    } catch (err) {
      console.error('Update user error:', err);
      setEditError('Error updating user');
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">
          Manage Offisphere admins, managers and employees.
        </p>
      </div>

      {/* Create user form */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Create new user
        </h2>

        {createError && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {createError}
          </div>
        )}

        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Full name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) =>
                handleChange('full_name', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="user@company.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                handleChange('password', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              Roles
              <span className="text-[11px] text-slate-400 ml-1">
                (at least one, default employee)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['admin', 'manager', 'employee'].map((role) => {
                const selected = form.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRoleCreate(role)}
                    className={`px-3 py-1 rounded-full text-xs border transition ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:opacity-90 disabled:opacity-60"
            >
              {creating ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </div>

      {/* Users table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Users
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
                <th className="text-left px-3 py-1">Email</th>
                <th className="text-left px-3 py-1">Roles</th>
                <th className="text-left px-3 py-1">Status</th>
                <th className="text-left px-3 py-1">Created</th>
                <th className="text-right px-3 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="bg-slate-50 hover:bg-slate-100 rounded-xl"
                  >
                    <td className="px-3 py-3 rounded-l-xl text-slate-900">
                      {user.full_name}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-3 py-3">
                      {renderRoles(user.roles)}
                    </td>
                    <td className="px-3 py-3">
                      {renderStatus(user.is_active)}
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-3 py-3 rounded-r-xl text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs hover:bg-slate-700"
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
      {editingUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Edit user
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
                <label className="text-xs text-slate-600">
                  Full name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) =>
                    handleEditChange('full_name', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    handleEditChange('email', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Status
                </label>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      handleEditChange('is_active', true)
                    }
                    className={`px-3 py-1 rounded-full border ${
                      editForm.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleEditChange('is_active', false)
                    }
                    className={`px-3 py-1 rounded-full border ${
                      editForm.is_active === false
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {['admin', 'manager', 'employee'].map((role) => {
                    const selected = editForm.roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRoleEdit(role)}
                        className={`px-3 py-1 rounded-full text-xs border transition ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    );
                  })}
                </div>
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
