'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Venue } from '@/types';
import LogoutButton from '@/components/LogoutButton';

export default function AdminVenuesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingVenues, setLoadingVenues] = useState(true);

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
      fetchVenues();
    }
  }, [user, loading, router]);

  const fetchVenues = async () => {
    setLoadingVenues(true);
    setError('');
    const res = await fetch('/api/admin/venues');
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error ?? 'Failed to load venues');
      setLoadingVenues(false);
      return;
    }
    setVenues(json.data ?? []);
    setLoadingVenues(false);
  };

  const createVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error ?? 'Failed to create venue');
      setSaving(false);
      return;
    }

    setName('');
    await fetchVenues();
    setSaving(false);
  };

  const deleteVenue = async (id: string) => {
    if (!id) return;
    setError('');
    setDeletingId(id);
    const prev = venues;
    setVenues((v) => v.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/admin/venues?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? 'Failed to delete venue');
      }
    } catch (e: any) {
      setVenues(prev);
      setError(e?.message ?? 'Failed to delete venue');
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

  const filteredVenues = venues.filter((v) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (v.name ?? '').toLowerCase().includes(q);
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
                <span className="hidden sm:inline text-sm text-gray-500">Venues</span>
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create Venue</h2>
            <form onSubmit={createVenue} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Venue name (e.g. Main Hall)"
                required
                className="border border-gray-300 rounded-md py-2 px-3 md:col-span-2"
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
                <h2 className="text-lg font-medium text-gray-900">Existing Venues</h2>
                {loadingVenues && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    Loading…
                  </div>
                )}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search venues…"
                  className="w-full max-w-xs border border-gray-300 rounded-md py-2 px-3"
                />
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {filteredVenues.length === 0 ? (
                <li className="px-6 py-4 text-gray-500">No venues yet.</li>
              ) : (
                filteredVenues.map((v) => (
                  <li key={v.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="font-medium text-gray-900">{v.name}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-500">{v.is_active ? 'Active' : 'Inactive'}</div>
                      <button
                        type="button"
                        disabled={deletingId === v.id}
                        onClick={() => {
                          const ok = confirm(`Delete venue ${v.name}?`);
                          if (ok) deleteVenue(v.id);
                        }}
                        className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === v.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
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
