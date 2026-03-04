'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          <div className="text-gray-700">Loading your account…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const cards: { href: string; title: string; description: string }[] =
    user.role === 'admin'
      ? [
          { href: '/admin', title: 'Admin Panel', description: 'Manage units, venues, users, and assignments' },
          { href: '/admin/units', title: 'Units', description: 'Create and manage semester units' },
          { href: '/admin/venues', title: 'Venues', description: 'Preload venues for predictable locations' },
          { href: '/admin/assignments', title: 'Assignments', description: 'Assign trainers to units' },
          { href: '/admin/users', title: 'Users', description: 'Create lecturer accounts and manage roles' },
        ]
      : user.role === 'trainer'
        ? [
            { href: '/trainer', title: 'Trainer Dashboard', description: 'Create sessions and manage attendance' },
            { href: '/reports', title: 'Reports', description: 'View attendance reports for your sessions' },
          ]
        : [
            { href: '/trainee', title: 'Trainee Dashboard', description: 'Scan QR or enter code to mark attendance' },
          ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold">
                  K
                </span>
                <span className="hidden sm:inline text-xl font-semibold text-gray-900">KAS</span>
                <span className="hidden sm:inline text-sm text-gray-500">Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden sm:inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {user.role}
              </span>
              <div className="hidden sm:block text-right">
                <div className="text-gray-900 text-sm font-medium">{user.name}</div>
                <div className="text-gray-500 text-xs">{user.email}</div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="text-sm text-gray-600">Signed in as</div>
            <div className="text-lg font-medium text-gray-900">{user.email}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((c) => (
              <Link key={c.href} href={c.href} className="bg-white shadow rounded-lg p-6 hover:shadow-md">
                <div className="text-lg font-medium text-gray-900">{c.title}</div>
                <div className="text-sm text-gray-600 mt-1">{c.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
