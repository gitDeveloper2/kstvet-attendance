'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Session, Location, Unit, Venue } from '@/types';
import LogoutButton from '@/components/LogoutButton';

export default function TrainerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsError, setUnitsError] = useState<string>('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'trainer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchSessions();
      fetchLocations();
      fetchUnits();
      fetchVenues();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user?.id) {
      setLoadingSessions(false);
      return;
    }

    const res = await fetch(`/api/sessions?trainer_id=${encodeURIComponent(user.id)}`);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      console.error('Error fetching sessions:', json?.error ?? 'Unknown error');
      setSessions([]);
      setLoadingSessions(false);
      return;
    }

    setSessions(json.data || []);
    setLoadingSessions(false);
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching locations:', error);
    } else {
      setLocations(data || []);
    }
  };

  const fetchUnits = async () => {
    const res = await fetch('/api/trainer/units');
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const message = json?.error ?? 'Failed to load units';
      console.error('Error fetching trainer units:', message);
      setUnitsError(message);
      setUnits([]);
      return;
    }
    setUnitsError('');
    setUnits(json.data || []);
  };

  const fetchVenues = async () => {
    const res = await fetch('/api/venues');
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      console.error('Error fetching venues:', json?.error ?? 'Unknown error');
      setVenues([]);
      return;
    }
    setVenues(json.data || []);
  };

  if (loading || loadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'trainer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/trainer" className="flex items-center gap-3">
                <span className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold">
                  K
                </span>
                <span className="hidden sm:inline text-xl font-semibold text-gray-900">KAS</span>
                <span className="hidden sm:inline text-sm text-gray-500">Trainer</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/reports"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Reports
              </Link>
              <span className="hidden sm:inline text-gray-700 text-sm sm:text-base">Welcome, {user.name}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Attendance Sessions</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create New Session
            </button>
          </div>

          {showCreateForm && (
            <CreateSessionForm
              locations={locations}
              units={units}
              unitsError={unitsError}
              venues={venues}
              trainerId={user.id}
              onSuccess={() => {
                setShowCreateForm(false);
                fetchSessions();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500">
                  No sessions found. Create your first session to get started.
                </li>
              ) : (
                sessions.map((session) => (
                  <SessionItem key={session.id} session={session} onUpdate={fetchSessions} />
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function SessionItem({ session, onUpdate }: { session: Session; onUpdate: () => void }) {
  const [showQR, setShowQR] = useState(false);

  return (
    <li className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <p className="text-sm font-medium text-indigo-600 truncate">
              {session.title}
            </p>
            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              session.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {session.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                {(session.unit as any)?.code ? `${(session.unit as any).code} • ` : ''}
                {session.lesson_number ? `Lesson ${session.lesson_number} • ` : ''}
                {session.venue?.name || session.location?.name || (session as any).location_name || '—'}
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                {session.date} at {session.start_time} - {session.end_time}
              </p>
            </div>
          </div>
          {session.description && (
            <p className="mt-2 text-sm text-gray-600">{session.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (!session.is_active) return;
              setShowQR(!showQR);
            }}
            disabled={!session.is_active}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showQR ? 'Hide' : 'Show'} QR
          </button>
        </div>
      </div>

      {!session.is_active && (
        <div className="mt-3 text-xs text-gray-500">
          This session is inactive/expired. QR code and session token are disabled.
        </div>
      )}

      {showQR && session.is_active && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <QRCodeDisplay qrToken={session.qr_token} sessionTitle={session.title} />
        </div>
      )}
    </li>
  );
}

function QRCodeDisplay({ qrToken, sessionTitle }: { qrToken: string; sessionTitle: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate QR code using a simple API or library
    setQrCodeUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`
    );
  }, [qrToken, sessionTitle]);

  return (
    <div className="text-center">
      <h4 className="text-sm font-medium text-gray-900 mb-2">QR Code for {sessionTitle}</h4>
      <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
      <div className="mt-3 max-w-md mx-auto">
        <div className="text-left text-xs font-medium text-gray-700 mb-1">Session Code</div>
        <div className="flex gap-2">
          <input
            value={qrToken}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-mono bg-white"
          />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(qrToken);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              } catch (e) {
                try {
                  const el = document.createElement('textarea');
                  el.value = qrToken;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy');
                  document.body.removeChild(el);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                } catch {
                  // ignore
                }
              }
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Trainees can type this code if QR scanning fails.
        </p>
      </div>
    </div>
  );
}

function CreateSessionForm({ 
  locations, 
  units,
  unitsError,
  venues,
  trainerId, 
  onSuccess, 
  onCancel 
}: { 
  locations: Location[];
  units: Unit[];
  unitsError: string;
  venues: Venue[];
  trainerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    description: '',
    unit_id: '',
    venue_id: '',
    date: '',
    start_time: '',
    end_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.unit_id) {
      setError('Please select a unit');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unit_id: formData.unit_id,
        venue_id: formData.venue_id || null,
        description: formData.description,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setError(result?.error ?? 'Failed to create session');
    } else {
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Create New Attendance Session
        </h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              {unitsError ? (
                <div className="mt-1 text-sm text-red-600">{unitsError}</div>
              ) : units.length === 0 ? (
                <div className="mt-1 text-sm text-gray-600">No units assigned to your account yet.</div>
              ) : null}
              <select
                required
                value={formData.unit_id}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} - {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Venue (Optional)</label>
              <select
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
