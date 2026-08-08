'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, User, Palette, Sun, Moon, Monitor, Circle, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'theme' | 'color';

const THEMES = [
  { value: 'LIGHT',  label: 'Light',  icon: Sun },
  { value: 'DARK',   label: 'Dark',   icon: Moon },
  { value: 'SYSTEM', label: 'System', icon: Monitor },
];

const ACCENT_COLORS = [
  { value: 'BLUE',    label: 'Blue',    hex: '#3b82f6' },
  { value: 'AMBER',   label: 'Amber',   hex: '#f59e0b' },
  { value: 'PINK',    label: 'Pink',    hex: '#ec4899' },
  { value: 'ROSE',    label: 'Rose',    hex: '#f43f5e' },
  { value: 'EMERALD', label: 'Emerald', hex: '#10b981' },
];

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'theme',   label: 'Theme',   icon: Sun },
  { id: 'color',   label: 'Color',   icon: Circle },
];

export default function ProfilePage() {
  const { user, token, logout, updateUser } = useStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [search, setSearch] = useState('');
  const [name, setName] = useState(user?.name ?? '');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  if (!token || !user) {
    router.push('/login');
    return null;
  }

  const filteredNav = NAV_ITEMS.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/me', { name });
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleTheme = async (themeMode: string) => {
    updateUser({ themeMode: themeMode as any });
    try {
      await api.patch('/users/me/theme', { themeMode, accentColor: user.accentColor });
    } catch {
      toast.error('Failed to save theme.');
    }
  };

  const handleAccent = async (accentColor: string) => {
    updateUser({ accentColor: accentColor as any });
    try {
      await api.patch('/users/me/theme', { themeMode: user.themeMode, accentColor });
    } catch {
      toast.error('Failed to save accent color.');
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">

      {/* ── Settings Sidebar ── */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--card)] h-full">
        {/* Back to app */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-4 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </button>

        {/* Search */}
        <div className="px-3 mb-3">
          <div className="flex items-center gap-2 bg-[var(--muted)] rounded-lg px-3 py-2 border border-[var(--border)]">
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-sm outline-none w-full text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-0.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  isActive
                    ? 'bg-[var(--muted)] text-[var(--foreground)] font-medium'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60 hover:text-[var(--foreground)]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-[var(--muted)]/20 p-10">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <>
              <h1 className="text-2xl font-semibold mb-6">Profile</h1>

              {/* Profile details card */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                {/* Profile picture row */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--foreground)]">Profile picture</span>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Email row */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--foreground)]">Email</span>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <span>{user.email || 'guest@ablespace.app'}</span>
                    <Pencil className="w-3.5 h-3.5 cursor-pointer hover:text-[var(--foreground)] transition-colors" />
                  </div>
                </div>

                {/* Full name row */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--foreground)]">Full name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleSave}
                    placeholder="Your name"
                    className="text-sm text-right bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 w-48 outline-none focus:ring-1 focus:ring-[var(--primary)] transition placeholder:text-[var(--muted-foreground)] text-[var(--foreground)]"
                  />
                </div>

                {/* Title row */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--border)]">
                  <div>
                    <p className="text-sm text-[var(--foreground)]">Title</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Your job title or role</p>
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Designer"
                    className="text-sm text-right bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 w-48 outline-none focus:ring-1 focus:ring-[var(--primary)] transition placeholder:text-[var(--muted-foreground)] text-[var(--foreground)]"
                  />
                </div>

                {/* Username row */}
                <div className="flex items-start justify-between px-6 py-5">
                  <div>
                    <p className="text-sm text-[var(--foreground)]">Username</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">One word, like a nickname or first name</p>
                  </div>
                  <input
                    defaultValue={user.name?.split(' ')[0]?.toLowerCase()}
                    placeholder="username"
                    className="text-sm text-right bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 w-48 outline-none focus:ring-1 focus:ring-[var(--primary)] transition placeholder:text-[var(--muted-foreground)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Workspace access card */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Workspace access</h2>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-5">
                    <span className="text-sm text-[var(--muted-foreground)]">Remove yourself from the workspace</span>
                    <button
                      onClick={() => toast.error('Leave workspace not available for workspace owner.')}
                      className="px-4 py-1.5 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/40 rounded-lg transition-colors"
                    >
                      Leave Workspace
                    </button>
                  </div>
                </div>
              </div>

              {/* Log out */}
              <div className="pt-2">
                <button
                  onClick={() => { logout(); router.push('/login'); }}
                  className="text-sm text-red-500 hover:text-red-600 hover:underline transition-colors"
                >
                  Log out of all devices
                </button>
              </div>
            </>
          )}

          {/* ── THEME TAB ── */}
          {activeTab === 'theme' && (
            <>
              <h1 className="text-2xl font-semibold mb-6">Appearance</h1>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold mb-4">Theme</h2>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((t) => {
                    const Icon = t.icon;
                    const isActive = user.themeMode === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => handleTheme(t.value)}
                        className={cn(
                          'flex flex-col items-center gap-3 py-5 rounded-xl border-2 transition-all',
                          isActive
                            ? 'border-[var(--primary)] bg-[var(--primary)]/8 text-[var(--primary)]'
                            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── COLOR TAB ── */}
          {activeTab === 'color' && (
            <>
              <h1 className="text-2xl font-semibold mb-6">Accent Color</h1>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <p className="text-sm text-[var(--muted-foreground)] mb-5">
                  Choose an accent color to personalize your workspace.
                </p>
                <div className="grid grid-cols-5 gap-4">
                  {ACCENT_COLORS.map((c) => {
                    const isActive = user.accentColor === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => handleAccent(c.value)}
                        className="flex flex-col items-center gap-2.5"
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full transition-all hover:scale-110',
                            isActive && 'ring-2 ring-offset-2 ring-offset-[var(--background)] scale-110'
                          )}
                          style={{
                            backgroundColor: c.hex,
                            '--tw-ring-color': c.hex,
                          } as React.CSSProperties}
                        />
                        <span className={cn('text-xs font-medium', isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]')}>
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
