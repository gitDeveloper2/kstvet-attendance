'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LogoutButton from '@/components/LogoutButton';

export default function AdminHomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

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
              </Link>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <span className="text-gray-700 text-sm sm:text-base">Welcome, {user.name}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/units" className="bg-white shadow rounded-lg p-6 hover:shadow-md">
              <div className="text-lg font-medium text-gray-900">Units</div>
              <div className="text-sm text-gray-600 mt-1">Create and manage semester units</div>
            </Link>

            <Link href="/admin/venues" className="bg-white shadow rounded-lg p-6 hover:shadow-md">
              <div className="text-lg font-medium text-gray-900">Venues</div>
              <div className="text-sm text-gray-600 mt-1">Preload venues for predictable locations</div>
            </Link>

            <Link href="/admin/assignments" className="bg-white shadow rounded-lg p-6 hover:shadow-md">
              <div className="text-lg font-medium text-gray-900">Trainer Assignments</div>
              <div className="text-sm text-gray-600 mt-1">Assign trainers to units</div>
            </Link>

            <Link href="/admin/users" className="bg-white shadow rounded-lg p-6 hover:shadow-md">
              <div className="text-lg font-medium text-gray-900">Users</div>
              <div className="text-sm text-gray-600 mt-1">Create lecturer accounts and manage roles</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
