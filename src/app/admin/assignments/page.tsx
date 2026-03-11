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
  const [assignments, setAssignments] = useState<any[]>([]);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
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

    const assignmentsRes = await fetch('/api/admin/trainer-units');

    const usersJson = await usersRes.json().catch(() => null);
    const unitsJson = await unitsRes.json().catch(() => null);
    const assignmentsJson = await assignmentsRes.json().catch(() => null);

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

    if (!assignmentsRes.ok || !assignmentsJson?.success) {
      setError(assignmentsJson?.error ?? 'Failed to load assignments');
      setLoadingData(false);
      return;
    }

    setTrainers(usersJson.data ?? []);
    setUnits(unitsJson.data ?? []);
    setAssignments(assignmentsJson.data ?? []);
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
    await fetchData();
    setSaving(false);
  };

  const deleteAssignment = async (trainer_id: string, unit_id: string) => {
    const key = `${trainer_id}:${unit_id}`;
    setError('');
    setDeletingKey(key);
    const prev = assignments;
    setAssignments((a) => a.filter((x) => !(x.trainer_id === trainer_id && x.unit_id === unit_id)));

    try {
      const res = await fetch(
        `/api/admin/trainer-units?trainer_id=${encodeURIComponent(trainer_id)}&unit_id=${encodeURIComponent(unit_id)}`,
        { method: 'DELETE' }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? 'Failed to delete assignment');
      }
    } catch (e: any) {
      setAssignments(prev);
      setError(e?.message ?? 'Failed to delete assignment');
    } finally {
      setDeletingKey(null);
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
                <span className="hidden sm:inline text-sm text-gray-500">Assignments</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Assign Trainer to Unit</h2>
              {loadingData && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  Loading…
                </div>
              )}
            </div>
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

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Current Assignments</h2>
                {loadingData && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    Loading…
                  </div>
                )}
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {assignments.length === 0 ? (
                <li className="px-6 py-4 text-gray-500">No assignments yet.</li>
              ) : (
                assignments.map((a: any) => {
                  const key = `${a.trainer_id}:${a.unit_id}`;
                  return (
                    <li key={key} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {a.trainer?.name ?? 'Trainer'} ({a.trainer?.email ?? '—'})
                        </div>
                        <div className="text-sm text-gray-600">
                          {a.unit?.code ?? '—'} - {a.unit?.name ?? '—'}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={deletingKey === key}
                        onClick={() => {
                          const ok = confirm('Remove this assignment?');
                          if (ok) deleteAssignment(a.trainer_id, a.unit_id);
                        }}
                        className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingKey === key ? 'Removing…' : 'Remove'}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
