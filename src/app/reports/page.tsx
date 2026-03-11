'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Attendance, Session, User } from '@/types';
import LogoutButton from '@/components/LogoutButton';

interface AttendanceReport {
  session: Session & { location: any };
  attendees: (Attendance & { user: User })[];
  total_attendees: number;
}

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reportsError, setReportsError] = useState<string>('');
  const [filters, setFilters] = useState({
    session_id: '',
    date_from: '',
    date_to: '',
    user_id: '',
  });
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'trainer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchSessions();
      fetchUsers();
      fetchReports();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user?.id) {
      return;
    }

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        location:locations(*),
        unit:units(*),
        venue:venues(*)
      `)
      .eq('trainer_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions(data || []);
    }
  };

  const deleteAttendance = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/attendance?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error ?? 'Failed to delete attendance');
      }
      fetchReports();
    } catch (e: any) {
      setReportsError(e?.message ?? 'Failed to delete attendance');
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'trainee')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    setReportsError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        setReports([]);
        setReportsError(result?.error ?? 'Failed to load reports');
        return;
      }

      if (result.success) {
        // Group attendance by session
        const groupedData = result.data.reduce((acc: any, record: any) => {
          const sessionId = record.session_id;
          if (!acc[sessionId]) {
            acc[sessionId] = {
              session: record.session,
              attendees: [],
              total_attendees: 0,
            };
          }
          acc[sessionId].attendees.push(record);
          acc[sessionId].total_attendees++;
          return acc;
        }, {});

        setReports(Object.values(groupedData));
      }
    } catch (error) {
      setReports([]);
      setReportsError('Failed to load reports');
      console.error('Error fetching reports:', error);
    }
    setLoadingReports(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchReports();
  };

  const clearFilters = () => {
    setFilters({
      session_id: '',
      date_from: '',
      date_to: '',
      user_id: '',
    });
  };

  if (loading) {
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
              <Link href="/reports" className="flex items-center gap-3">
                <span className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold">
                  K
                </span>
                <span className="hidden sm:inline text-xl font-semibold text-gray-900">KAS</span>
                <span className="hidden sm:inline text-sm text-gray-500">Reports</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/trainer"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <span className="hidden sm:inline text-gray-700 text-sm sm:text-base">Welcome, {user.name}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              {loadingReports && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  Loading…
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session
                </label>
                <select
                  value={filters.session_id}
                  onChange={(e) => handleFilterChange('session_id', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Sessions</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} ({session.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <select
                  value={filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button
                onClick={applyFilters}
                disabled={loadingReports}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                disabled={loadingReports}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Reports */}
          <div className="space-y-6">
            {reportsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {reportsError}
              </div>
            )}
            {reports.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                {reportsError
                  ? 'Unable to load reports.'
                  : 'No attendance records yet for your sessions. Mark attendance for a session, then come back here.'}
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.session.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{report.session.title}</h3>
                        <p className="text-sm text-gray-600">
                          {(report.session.unit as any)?.code ? `${(report.session.unit as any).code} • ` : ''}
                          {report.session.lesson_number ? `Lesson ${report.session.lesson_number} • ` : ''}
                          {report.session.date} • {report.session.venue?.name || report.session.location?.name || (report.session as any).location_name || '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">{report.total_attendees}</p>
                        <p className="text-sm text-gray-500">Attendees</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Attendees</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Check-in Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Location Verified
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.attendees.map((attendance: any) => (
                            <tr key={attendance.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {attendance.user?.name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {attendance.user?.email || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(attendance.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    attendance.verified
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {attendance.verified ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
