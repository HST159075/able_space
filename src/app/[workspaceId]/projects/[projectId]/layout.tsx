'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const tabs = [
    { label: 'Board', href: `/${workspaceId}/projects/${projectId}/board`, icon: LayoutGrid },
    { label: 'List',  href: `/${workspaceId}/projects/${projectId}/list`,  icon: List },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* View tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 border-b border-[var(--border)] bg-[var(--background)]">
        {tabs.map((tab) => {
          const isActive = pathname.endsWith(tab.href.split('/').pop()!);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
