'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/axios';

export default function DashboardRedirect() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const _hasHydrated = useStore((state) => state._hasHydrated);
  const [error, setError] = useState<string | null>(null);
  const isWorking = useRef(false);

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage
    if (!_hasHydrated) return;
    // Prevent double execution
    if (isWorking.current) return;

    if (!token) {
      router.replace('/login');
      return;
    }

    const run = async () => {
      isWorking.current = true;
      try {
        const wsRes = await api.get('/workspaces');
        let workspaces = wsRes.data.data;

        if (workspaces.length === 0) {
          // Seed demo data for new users
          const newWs = await api.post('/workspaces', { name: 'My Workspace' });
          const wsId = newWs.data.data.id;
          workspaces = [newWs.data.data];

          await api.post(`/workspaces/${wsId}/teams`, { name: 'Engineering' });
          await api.post(`/workspaces/${wsId}/teams`, { name: 'Design' });

          const l1 = await api.post(`/workspaces/${wsId}/labels`, { name: 'Feature', color: '#3b82f6' });
          const l2 = await api.post(`/workspaces/${wsId}/labels`, { name: 'Bug', color: '#ef4444' });

          const newProj = await api.post(`/workspaces/${wsId}/projects`, { name: 'Website Redesign' });
          const pId = newProj.data.data.id;

          const t3 = await api.post(`/projects/${pId}/tasks`, {
            title: 'Design System Implementation',
            description: 'Create all base UI components.',
            status: 'DOING',
            priority: 'MEDIUM',
            labelIds: [l1.data.data.id],
          });
          await api.post(`/projects/${pId}/tasks`, { title: 'Wireframe Homepage', status: 'TODO', priority: 'HIGH', labelIds: [l1.data.data.id] });
          await api.post(`/projects/${pId}/tasks`, { title: 'Setup Next.js & Tailwind', status: 'TODO', priority: 'URGENT' });
          await api.post(`/projects/${pId}/tasks`, { title: 'Project Kickoff Meeting', status: 'COMPLETED', priority: 'LOW', labelIds: [l2.data.data.id] });
          await api.post(`/tasks/${t3.data.data.id}/subtasks`, { title: 'Button Component', status: 'COMPLETED' });
          await api.post(`/tasks/${t3.data.data.id}/subtasks`, { title: 'Input Component', status: 'DOING' });
          await api.post(`/tasks/${t3.data.data.id}/comments`, { content: 'Make sure to follow the new brand guidelines closely on this one.' });
        }

        const firstWorkspace = workspaces[0];
        const pRes = await api.get(`/workspaces/${firstWorkspace.id}/projects`);
        const projects = pRes.data.data;

        if (projects.length === 0) {
          const newProj = await api.post(`/workspaces/${firstWorkspace.id}/projects`, { name: 'My First Project' });
          router.replace(`/${firstWorkspace.id}/projects/${newProj.data.data.id}/board`);
        } else {
          router.replace(`/${firstWorkspace.id}/projects/${projects[0].id}/board`);
        }
      } catch (err) {
        console.error('Dashboard init error:', err);
        setError('Failed to load workspace. Please try again.');
        isWorking.current = false;
      }
    };

    run();
  }, [token, _hasHydrated, router]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="glass p-8 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <p className="text-[var(--muted-foreground)] mb-6">{error}</p>
          <button
            onClick={() => { useStore.getState().logout(); router.replace('/login'); }}
            className="text-[var(--primary)] underline"
          >
            Go back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--muted-foreground)]">Loading your workspace...</p>
      </div>
    </div>
  );
}
