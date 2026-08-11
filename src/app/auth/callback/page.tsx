'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (!token || !userParam) {
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      setAuth(token, user);
      router.replace('/dashboard');
    } catch {
      router.replace('/login');
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--muted)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--muted-foreground)] text-sm">Signing you in...</p>
      </div>
    </div>
  );
}

// useSearchParams() requires Suspense boundary in Next.js 14+
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--muted)]">
          <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
