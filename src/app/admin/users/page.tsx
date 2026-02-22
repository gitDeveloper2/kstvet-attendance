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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
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

  if (loading || loadingUsers) {
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
              <h1 className="text-xl font-semibold text-gray-900">Users</h1>
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
              <h2 className="text-lg font-medium text-gray-900">Trainers</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {trainers.length === 0 ? (
                <li className="px-6 py-4 text-gray-500">No trainers found.</li>
              ) : (
                trainers.map((t) => (
                  <li key={t.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-600">{t.email}</div>
                    </div>
                    <div className="text-sm text-gray-500">Role: {t.role}</div>
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
