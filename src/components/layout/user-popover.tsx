'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import {
  ChevronsUpDown, Sun, Moon, Monitor, Settings, ChevronRight, Check, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = [
  { value: 'LIGHT',  label: 'Light',  icon: Sun },
  { value: 'DARK',   label: 'Dark',   icon: Moon },
  { value: 'SYSTEM', label: 'System', icon: Monitor },
];

const COLORS = [
  { value: 'AMBER',   label: 'Amber',   hex: '#f59e0b' },
  { value: 'BLUE',    label: 'Blue',    hex: '#3b82f6' },
  { value: 'PINK',    label: 'Pink',    hex: '#ec4899' },
  { value: 'ROSE',    label: 'Rose',    hex: '#f43f5e' },
  { value: 'EMERALD', label: 'Emerald', hex: '#10b981' },
  { value: 'BLACK',   label: 'Black',   hex: '#09090b' },
];

type Submenu = 'theme' | 'color' | null;

export function UserPopover() {
  const { user, logout, updateUser } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<Submenu>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTheme = async (themeMode: string) => {
    updateUser({ themeMode: themeMode as any });
    setOpen(false); setSubmenu(null);
    try { await api.patch('/users/me/theme', { themeMode, accentColor: user?.accentColor }); }
    catch { toast.error('Failed to save theme.'); }
  };

  const handleColor = async (accentColor: string) => {
    updateUser({ accentColor: accentColor as any });
    setOpen(false); setSubmenu(null);
    try { await api.patch('/users/me/theme', { themeMode: user?.themeMode, accentColor }); }
    catch { toast.error('Failed to save color.'); }
  };

  const activeColor = COLORS.find(c => c.value === user?.accentColor) ?? COLORS[1];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { setOpen(v => !v); setSubmenu(null); }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--muted)] transition-colors group"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-semibold truncate flex-1 text-left text-[var(--foreground)]">
          {user?.name || 'Guest'}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 z-50 w-56 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl overflow-visible"
          >
            {/* User info */}
            <div className="flex flex-col items-center py-5 px-4 border-b border-[var(--border)]">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-md mb-2">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{user?.email || 'guest@ablespace.app'}</p>
            </div>

            {/* Menu items */}
            <div className="py-1.5 px-1.5 space-y-0.5">

              {/* Change Theme */}
              <div className="relative">
                <button
                  onClick={() => setSubmenu(submenu === 'theme' ? null : 'theme')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
                >
                  <Sun className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="flex-1 text-left">Change Theme</span>
                  <ChevronRight className={cn('w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform', submenu === 'theme' && 'rotate-90')} />
                </button>

                <AnimatePresence>
                  {submenu === 'theme' && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-full top-0 ml-1.5 w-40 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden py-1"
                    >
                      <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-3 py-1.5">Theme</p>
                      {THEMES.map(t => {
                        const Icon = t.icon;
                        const isActive = user?.themeMode === t.value;
                        return (
                          <button
                            key={t.value}
                            onClick={() => handleTheme(t.value)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
                          >
                            <Icon className="w-4 h-4 text-[var(--muted-foreground)]" />
                            <span className="flex-1 text-left">{t.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Color Mode */}
              <div className="relative">
                <button
                  onClick={() => setSubmenu(submenu === 'color' ? null : 'color')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
                >
                  <div className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: activeColor.hex }} />
                  <span className="flex-1 text-left">Color Mode</span>
                  <ChevronRight className={cn('w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform', submenu === 'color' && 'rotate-90')} />
                </button>

                <AnimatePresence>
                  {submenu === 'color' && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-full top-0 ml-1.5 w-44 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden py-1"
                    >
                      <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-3 py-1.5">Color Mode</p>
                      {COLORS.map(c => {
                        const isActive = user?.accentColor === c.value;
                        return (
                          <button
                            key={c.value}
                            onClick={() => handleColor(c.value)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
                          >
                            <div className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: c.hex }} />
                            <span className="flex-1 text-left">{c.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Settings */}
              <button
                onClick={() => { setOpen(false); router.push('/profile'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
              >
                <Settings className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span>Settings</span>
              </button>
            </div>

            {/* Log out */}
            <div className="py-1.5 px-1.5 border-t border-[var(--border)]">
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
