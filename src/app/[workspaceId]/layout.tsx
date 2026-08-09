"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token, _hasHydrated } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage before checking auth
    if (!_hasHydrated) return;

    if (!token || !user) {
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [token, user, router, pathname, _hasHydrated]);

  // Show nothing while store is hydrating from localStorage
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto bg-[var(--muted)]/30">
          {children}
        </main>
      </div>
    </div>
  );
}
