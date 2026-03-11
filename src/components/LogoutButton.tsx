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
      router.replace('/login');
    }
  };

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className={
        className ??
        'inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50'
      }
      type="button"
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M3 4.75A2.75 2.75 0 0 1 5.75 2h4.5a.75.75 0 0 1 0 1.5h-4.5A1.25 1.25 0 0 0 4.5 4.75v10.5A1.25 1.25 0 0 0 5.75 16.5h4.5a.75.75 0 0 1 0 1.5h-4.5A2.75 2.75 0 0 1 3 15.25V4.75Zm10.47 2.72a.75.75 0 0 1 1.06 0l2.25 2.25c.3.3.3.77 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H7.75a.75.75 0 0 1 0-1.5h6.69l-.97-.97a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{loading ? 'Logging out…' : 'Logout'}</span>
    </button>
  );
}
