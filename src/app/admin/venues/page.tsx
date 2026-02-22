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
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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

  if (loading || loadingVenues) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-indigo-700 hover:text-indigo-900 text-sm font-medium">
                Admin
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Venues</h1>
            </div>
            <div className="flex items-center">
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
              <h2 className="text-lg font-medium text-gray-900">Existing Venues</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {venues.length === 0 ? (
                <li className="px-6 py-4 text-gray-500">No venues yet.</li>
              ) : (
                venues.map((v) => (
                  <li key={v.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="font-medium text-gray-900">{v.name}</div>
                    <div className="text-sm text-gray-500">{v.is_active ? 'Active' : 'Inactive'}</div>
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
