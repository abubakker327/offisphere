"use client";

import { useEffect, useState } from "react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    file_url: "",
    visibility: "company",
  });

  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    file_url: "",
    visibility: "company",
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/documents`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error fetching documents");
        } else {
          setDocuments(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        console.error("Documents fetch error:", err);
        setError("Error connecting to server");
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
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch(`${API_BASE}/api/documents`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.message || "Error creating document");
        setCreating(false);
        return;
      }

      setDocuments(Array.isArray(data) ? data : []);
      setForm({
        title: "",
        category: "",
        description: "",
        file_url: "",
        visibility: "company",
      });
      setCreateError("");
    } catch (err) {
      console.error("Create document error:", err);
      setCreateError("Error connecting to server");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (doc) => {
    setEditingDoc(doc);
    setEditError("");
    setEditForm({
      title: doc.title || "",
      category: doc.category || "",
      description: doc.description || "",
      file_url: doc.file_url || "",
      visibility: doc.visibility || "company",
    });
  };

  const closeEdit = () => {
    setEditingDoc(null);
    setEditError("");
    setEditSaving(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;

    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/api/documents/${editingDoc.id}`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.message || "Error updating document");
        setEditSaving(false);
        return;
      }

      setDocuments(Array.isArray(data) ? data : []);
      closeEdit();
    } catch (err) {
      console.error("Update document error:", err);
      setEditError("Error connecting to server");
      setEditSaving(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
        credentials: "include",
        method: "DELETE",
        headers: {},
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error deleting document");
        return;
      }

      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Delete document error:", err);
      alert("Error connecting to server");
    }
  };

  const formatDate = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
          <span>Document hub</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">
            Store links to policies, SOPs, contracts, and other important
            documents.
          </p>
        </div>
      </div>

      {/* Create document */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add new document
            </h2>
            <p className="text-xs text-slate-500">
              Organize policies, SOPs, and shared resources.
            </p>
          </div>
        </div>

        {createError && (
          <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {createError}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Employee Handbook, Leave Policy..."
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => handleFormChange("category", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="HR, Finance, IT..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">File / link URL</label>
            <input
              type="url"
              value={form.file_url}
              onChange={(e) => handleFormChange("file_url", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Visibility</label>
            <select
              value={form.visibility}
              onChange={(e) => handleFormChange("visibility", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            >
              <option value="company">Entire company</option>
              <option value="team">Team/department</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-xs text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs resize-none"
              placeholder="Short summary of what this document covers."
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-blue-600 shadow-lg shadow-blue-300/40 hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? "Saving..." : "Add document"}
            </button>
          </div>
        </form>
      </div>

      {/* Documents list */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Documents library
            </h2>
            <p className="text-xs text-slate-500">
              {documents.length} documents
            </p>
          </div>
        </div>

        {error && (
          <div className="px-6 pt-4">
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Title</th>
                <th className="text-left px-6 py-3 font-semibold">Category</th>
                <th className="text-left px-6 py-3 font-semibold">
                  Visibility
                </th>
                <th className="text-left px-6 py-3 font-semibold">Link</th>
                <th className="text-left px-6 py-3 font-semibold">Created</th>
                <th className="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">
                      {doc.title}
                      {doc.description && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {doc.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {doc.category || "--"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {doc.visibility || "company"}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-slate-400">No link</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(doc)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800"
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Edit document
              </h3>
              <button
                type="button"
                onClick={closeEdit}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {editError && (
              <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    handleFormChange("title", e.target.value, true)
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">Category</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) =>
                    handleFormChange("category", e.target.value, true)
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    handleFormChange("file_url", e.target.value, true)
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">Visibility</label>
                <select
                  value={editForm.visibility}
                  onChange={(e) =>
                    handleFormChange("visibility", e.target.value, true)
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                >
                  <option value="company">Entire company</option>
                  <option value="team">Team/department</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value, true)
                  }
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-2xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-2xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                >
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
