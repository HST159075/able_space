'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const user = useStore((state) => state.user);

  // Sync theme with the HTML element
  useEffect(() => {
    const root = document.documentElement;

    // Step 1: handle dark mode
    if (user?.themeMode === 'DARK') {
      root.classList.add('dark');
    } else if (user?.themeMode === 'LIGHT') {
      root.classList.remove('dark');
    } else {
      // SYSTEM
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }

    // Step 2: remove old accent class, then apply new one
    const existing = Array.from(root.classList).filter(c => c.startsWith('theme-'));
    existing.forEach(c => root.classList.remove(c));
    if (user?.accentColor && user.accentColor !== 'BLUE') {
      root.classList.add(`theme-${user.accentColor.toLowerCase()}`);
    }
  }, [user?.themeMode, user?.accentColor]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
