'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Bell, Moon, Sun, Monitor, LogOut, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useProjects, useTasks } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';

// --- Global Search Overlay ---
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const params = useParams();
  const workspaceId = params.workspaceId as string || '';
  const router = useRouter();

  const { data: projects } = useProjects(workspaceId);

  // Collect all tasks from first project (simple approach)
  const firstProjectId = projects?.[0]?.id || '';
  const { data: tasks } = useTasks(firstProjectId);

  const allTasks = tasks || [];
  const filteredTasks = query.length > 1
    ? allTasks.filter((t: any) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.description?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelectTask = (task: any) => {
    // Navigate to the project board where the task lives
    const projectId = firstProjectId;
    router.push(`/${workspaceId}/projects/${projectId}/board`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-sm outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-0.5 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="px-2 py-1 text-xs font-mono bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {query.length <= 1 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              Start typing to search tasks...
            </div>
          )}
          {query.length > 1 && filteredTasks.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No tasks found for &quot;{query}&quot;
            </div>
          )}
          {filteredTasks.map((task: any) => (
            <button
              key={task.id}
              onClick={() => handleSelectTask(task)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-0 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <span className="text-xs text-[var(--muted-foreground)]">
            {filteredTasks.length > 0 ? `${filteredTasks.length} result${filteredTasks.length !== 1 ? 's' : ''}` : 'Search across all tasks'}
          </span>
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span><kbd className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded">↵</kbd> select</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Topbar() {
  const { user, toggleSidebar, logout, updateUser } = useStore();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const cycleTheme = () => {
    if (!user) return;
    const themes: ('LIGHT' | 'DARK' | 'SYSTEM')[] = ['LIGHT', 'DARK', 'SYSTEM'];
    const nextTheme = themes[(themes.indexOf(user.themeMode) + 1) % themes.length];
    updateUser({ themeMode: nextTheme });
  };

  const getThemeIcon = () => {
    if (user?.themeMode === 'DARK') return <Moon className="w-4 h-4" />;
    if (user?.themeMode === 'LIGHT') return <Sun className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  // Keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="h-14 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <Menu className="w-5 h-5" />
          </Button>
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 w-full max-w-md h-9 px-3 rounded-full bg-[var(--muted)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/80 transition-colors border border-[var(--border)]"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Search tasks...</span>
            <kbd className="ml-auto text-[10px] bg-[var(--background)] border border-[var(--border)] rounded px-1 py-0.5 font-mono hidden lg:block">Ctrl K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            title={`Theme: ${user?.themeMode}`}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {getThemeIcon()}
          </Button>
          <Button variant="ghost" size="icon" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <Bell className="w-4 h-4" />
          </Button>

          <div className="h-5 w-px bg-[var(--border)] mx-1" />

          <Link
            href="/profile"
            className="flex items-center gap-2 hover:bg-[var(--muted)] p-1.5 rounded-xl transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-sm text-left leading-none">
              <p className="font-medium text-[var(--foreground)] text-xs">{user?.name}</p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
