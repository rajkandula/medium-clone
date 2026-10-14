'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProfileDesignPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.username) {
      router.replace(`/profile/${user.username}`);
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <Loader2 size={20} className="animate-spin mx-auto" style={{ color: 'var(--color-brand)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Redirecting to your site editor...
        </p>
      </div>
    </div>
  );
}
