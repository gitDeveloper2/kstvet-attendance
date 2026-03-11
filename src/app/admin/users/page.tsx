'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import LogoutButton from '@/components/LogoutButton';

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [trainers, setTrainers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

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
      fetchUsers();
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError('');
    const res = await fetch('/api/admin/users?role=trainer');
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error ?? 'Failed to load trainers');
      setLoadingUsers(false);
      return;
    }
    setTrainers(json.data ?? []);
    setLoadingUsers(false);
  };

  const startEdit = (t: User) => {
    setEditingId(t.id);
    setEditName(t.name ?? '');
    setEditEmail(t.email ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditEmail('');
    setSavingEdit(false);
  };

  const saveEdit = async (id: string) => {
    setError('');
    setSuccess('');
    setSavingEdit(true);

    const patch: any = {};
    if (editName.trim()) patch.name = editName.trim();
    if (editEmail.trim()) patch.email = editEmail.trim();

    const prev = trainers;
    setTrainers((t) => t.map((x) => (x.id === id ? ({ ...(x as any), ...patch } as any) : x)));

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? 'Failed to update user');
      }
      await fetchUsers();
      cancelEdit();
    } catch (e: any) {
      setTrainers(prev);
      setError(e?.message ?? 'Failed to update user');
      setSavingEdit(false);
    }
  };

  const createTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'trainer' }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error ?? 'Failed to create trainer');
      setSaving(false);
      return;
    }

    setSuccess('Trainer account created successfully');
    setName('');
    setEmail('');
    setPassword('');
    await fetchUsers();
    setSaving(false);
  };

  const deleteTrainer = async (id: string) => {
    if (!id) return;
    setError('');
    setSuccess('');
    setDeletingId(id);

    const prev = trainers;
    setTrainers((t) => t.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? 'Failed to delete user');
      }
      setSuccess('User deleted.');
    } catch (e: any) {
      setTrainers(prev);
      setError(e?.message ?? 'Failed to delete user');
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

  const filtered = trainers.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.name ?? '').toLowerCase().includes(q) ||
      (t.email ?? '').toLowerCase().includes(q)
    );
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
                <span className="hidden sm:inline text-sm text-gray-500">Users</span>
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
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create Trainer Account</h2>
            <form onSubmit={createTrainer} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
                className="border border-gray-300 rounded-md py-2 px-3"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                required
                className="border border-gray-300 rounded-md py-2 px-3"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temp password"
                type="password"
                required
                className="border border-gray-300 rounded-md py-2 px-3"
              />
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-2">
              The trainer can log in using this email and password.
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium text-gray-900">Trainers</h2>
                {loadingUsers && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    Loading…
                  </div>
                )}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search trainers…"
                  className="w-full max-w-xs border border-gray-300 rounded-md py-2 px-3"
                />
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <li className="px-6 py-4 text-gray-500">No trainers found.</li>
              ) : (
                filtered.map((t) => (
                  <li key={t.id} className="px-6 py-4">
                    {editingId === t.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Name"
                            className="border border-gray-300 rounded-md py-2 px-3"
                          />
                          <input
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="Email"
                            className="border border-gray-300 rounded-md py-2 px-3"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() => saveEdit(t.id)}
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
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{t.name}</div>
                          <div className="text-sm text-gray-600">{t.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500">Role: {t.role}</div>
                          <button
                            type="button"
                            onClick={() => startEdit(t)}
                            className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === t.id}
                            onClick={() => {
                              const ok = confirm(`Delete user ${t.email}?`);
                              if (ok) deleteTrainer(t.id);
                            }}
                            className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === t.id ? 'Deleting…' : 'Delete'}
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
