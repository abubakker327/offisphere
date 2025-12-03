'use client';

import { useEffect, useState } from 'react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    file_url: '',
    visibility: 'company'
  });

  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    description: '',
    file_url: '',
    visibility: 'company'
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = window.localStorage.getItem('offisphere_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Error fetching documents');
        } else {
          setDocuments(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        console.error('Documents fetch error:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const handleFormChange = (field, value, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, [field]: value }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCreate = async (e) => {
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

      const res = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.message || 'Error creating document');
        setCreating(false);
        return;
      }

      setDocuments(Array.isArray(data) ? data : []);
      setForm({
        title: '',
        category: '',
        description: '',
        file_url: '',
        visibility: 'company'
      });
      setCreateError('');
    } catch (err) {
      console.error('Create document error:', err);
      setCreateError('Error connecting to server');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (doc) => {
    setEditingDoc(doc);
    setEditError('');
    setEditForm({
      title: doc.title || '',
      category: doc.category || '',
      description: doc.description || '',
      file_url: doc.file_url || '',
      visibility: doc.visibility || 'company'
    });
  };

  const closeEdit = () => {
    setEditingDoc(null);
    setEditError('');
    setEditSaving(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;

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
        `${API_BASE}/api/documents/${editingDoc.id}`,
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
        setEditError(data.message || 'Error updating document');
        setEditSaving(false);
        return;
      }

      setDocuments(Array.isArray(data) ? data : []);
      closeEdit();
    } catch (err) {
      console.error('Update document error:', err);
      setEditError('Error connecting to server');
      setEditSaving(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        alert('Not authenticated');
        return;
      }

      const res = await fetch(
        `${API_BASE}/api/documents/${docId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error deleting document');
        return;
      }

      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Delete document error:', err);
      alert('Error connecting to server');
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Documents
        </h1>
        <p className="text-sm text-slate-500">
          Store links to policies, SOPs, contracts and other important
          documents.
        </p>
      </div>

      {/* Create document */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Add new document
        </h2>

        {createError && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {createError}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                handleFormChange('title', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Employee Handbook, Leave Policy..."
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) =>
                handleFormChange('category', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="HR, Finance, IT..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              File / link URL
            </label>
            <input
              type="url"
              value={form.file_url}
              onChange={(e) =>
                handleFormChange('file_url', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              Visibility
            </label>
            <select
              value={form.visibility}
              onChange={(e) =>
                handleFormChange('visibility', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              <option value="company">Entire company</option>
              <option value="team">Team/department</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-xs text-slate-600">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                handleFormChange('description', e.target.value)
              }
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs resize-none"
              placeholder="Short summary of what this document covers."
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:opacity-90 disabled:opacity-60"
            >
              {creating ? 'Saving...' : 'Add document'}
            </button>
          </div>
        </form>
      </div>

      {/* Documents list */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Documents library
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
                <th className="text-left px-3 py-1">Title</th>
                <th className="text-left px-3 py-1">Category</th>
                <th className="text-left px-3 py-1">Visibility</th>
                <th className="text-left px-3 py-1">Link</th>
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
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="bg-slate-50 hover:bg-slate-100 rounded-xl"
                  >
                    <td className="px-3 py-3 rounded-l-xl text-slate-900">
                      {doc.title}
                      {doc.description && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {doc.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {doc.category || '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {doc.visibility || 'company'}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-slate-400">No link</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-3 py-3 rounded-r-xl text-right text-xs space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(doc)}
                        className="px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      >
                        Delete
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
      {editingDoc && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Edit document
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
                <label className="text-xs text-slate-600">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    handleFormChange('title', e.target.value, true)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Category
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) =>
                    handleFormChange('category', e.target.value, true)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  File / link URL
                </label>
                <input
                  type="url"
                  value={editForm.file_url}
                  onChange={(e) =>
                    handleFormChange('file_url', e.target.value, true)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Visibility
                </label>
                <select
                  value={editForm.visibility}
                  onChange={(e) =>
                    handleFormChange(
                      'visibility',
                      e.target.value,
                      true
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                >
                  <option value="company">Entire company</option>
                  <option value="team">Team/department</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    handleFormChange(
                      'description',
                      e.target.value,
                      true
                    )
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
