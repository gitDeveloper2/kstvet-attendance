'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Unit, User } from '@/types';
import LogoutButton from '@/components/LogoutButton';

export default function AdminAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [trainers, setTrainers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [trainerId, setTrainerId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setLoadingData(true);
    setError('');

    const [usersRes, unitsRes] = await Promise.all([
      fetch('/api/admin/users?role=trainer'),
      fetch('/api/admin/units'),
    ]);

    const usersJson = await usersRes.json().catch(() => null);
    const unitsJson = await unitsRes.json().catch(() => null);

    if (!usersRes.ok || !usersJson?.success) {
      setError(usersJson?.error ?? 'Failed to load trainers');
      setLoadingData(false);
      return;
    }

    if (!unitsRes.ok || !unitsJson?.success) {
      setError(unitsJson?.error ?? 'Failed to load units');
      setLoadingData(false);
      return;
    }

    setTrainers(usersJson.data ?? []);
    setUnits(unitsJson.data ?? []);
    setLoadingData(false);
  };

  const selectedTrainer = useMemo(
    () => trainers.find((t) => t.id === trainerId),
    [trainers, trainerId]
  );

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === unitId),
    [units, unitId]
  );

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerId || !unitId) return;

    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/trainer-units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainer_id: trainerId, unit_id: unitId }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error ?? 'Failed to assign');
      setSaving(false);
      return;
    }

    setTrainerId('');
    setUnitId('');
    setSaving(false);
  };

  if (loading || loadingData) {
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
              <h1 className="text-xl font-semibold text-gray-900">Trainer Assignments</h1>
            </div>
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Assign Trainer to Unit</h2>
            <form onSubmit={assign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Trainer</label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                  required
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} - {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-700">
                <div className="font-medium">Summary</div>
                <div className="mt-1">
                  Trainer: {selectedTrainer ? `${selectedTrainer.name} (${selectedTrainer.email})` : '—'}
                </div>
                <div>
                  Unit: {selectedUnit ? `${selectedUnit.code} - ${selectedUnit.name}` : '—'}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Assigning…' : 'Assign'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
