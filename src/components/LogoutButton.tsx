'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LogoutButton({ className }: { className?: string }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className={
        className ??
        'bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50'
      }
      type="button"
    >
      {loading ? 'Logging out…' : 'Logout'}
    </button>
  );
}
