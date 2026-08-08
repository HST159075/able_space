"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Basic auth protection
    if (!token || !user) {
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [token, user, router, pathname]);

  if (!token || !user) {
    return null; // Prevent rendering dashboard before redirecting to login
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
