'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Unit } from '@/types';
import LogoutButton from '@/components/LogoutButton';

export default function AdminUnitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      fetchUnits();
    }
  }, [user, loading, router]);

  const fetchUnits = async () => {
    setLoadingUnits(true);
    setError('');
    const res = await fetch('/api/admin/units');
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error ?? 'Failed to load units');
      setLoadingUnits(false);
      return;
    }
    setUnits(json.data ?? []);
    setLoadingUnits(false);
  };

  const startEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setEditCode(unit.code ?? '');
    setEditName(unit.name ?? '');
    setEditActive(unit.is_active ?? true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCode('');
    setEditName('');
    setEditActive(true);
    setSavingEdit(false);
  };

  const saveEdit = async (id: string) => {
    setError('');
    setSavingEdit(true);

    const patch: any = {
      is_active: Boolean(editActive),
    };
    if (editCode.trim()) patch.code = editCode.trim();
    if (editName.trim()) patch.name = editName.trim();

    const prev = units;
    setUnits((u) => u.map((x) => (x.id === id ? ({ ...(x as any), ...patch } as any) : x)));

    try {
      const res = await fetch(`/api/admin/units?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? 'Failed to update unit');
      }

      await fetchUnits();
      cancelEdit();
    } catch (e: any) {
      setUnits(prev);
      setError(e?.message ?? 'Failed to update unit');
      setSavingEdit(false);
    }
  };

  const createUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, name }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error ?? 'Failed to create unit');
      setSaving(false);
      return;
    }

    setCode('');
    setName('');
    await fetchUnits();
    setSaving(false);
  };

  const deleteUnit = async (id: string) => {
    if (!id) return;
    setError('');
    setDeletingId(id);

    const prev = units;
    setUnits((u) => u.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/admin/units?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? 'Failed to delete unit');
      }
    } catch (e: any) {
      setUnits(prev);
      setError(e?.message ?? 'Failed to delete unit');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const filteredUnits = units.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (u.code ?? '').toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center gap-3">
                <span className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold">
                  K
                </span>
                <span className="hidden sm:inline text-xl font-semibold text-gray-900">KAS</span>
                <span className="hidden sm:inline text-sm text-gray-500">Admin</span>
                <span className="hidden sm:inline text-sm text-gray-500">Units</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create Unit</h2>
            <form onSubmit={createUnit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code (e.g. CSMT101)"
                required
                className="border border-gray-300 rounded-md py-2 px-3"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (e.g. Communication Skills)"
                required
                className="border border-gray-300 rounded-md py-2 px-3"
              />
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium text-gray-900">Existing Units</h2>
                {loadingUnits && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    Loading…
                  </div>
                )}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search units…"
                  className="w-full max-w-xs border border-gray-300 rounded-md py-2 px-3"
                />
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {filteredUnits.length === 0 ? (
                <li className="px-6 py-4 text-gray-500">No units yet.</li>
              ) : (
                filteredUnits.map((u) => (
                  <li key={u.id} className="px-6 py-4">
                    {editingId === u.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            placeholder="Code"
                            className="border border-gray-300 rounded-md py-2 px-3"
                          />
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Name"
                            className="border border-gray-300 rounded-md py-2 px-3"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={editActive}
                                onChange={(e) => setEditActive(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              Active
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => saveEdit(u.id)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {savingEdit ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={cancelEdit}
                                className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{u.code}</div>
                          <div className="text-sm text-gray-600">{u.name}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500">{u.is_active ? 'Active' : 'Inactive'}</div>
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === u.id}
                            onClick={() => {
                              const ok = confirm(`Delete unit ${u.code}?`);
                              if (ok) deleteUnit(u.id);
                            }}
                            className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === u.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
