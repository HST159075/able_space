'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/axios';
import { useSession } from '@/lib/auth-client';

export default function DashboardRedirect() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const _hasHydrated = useStore((state) => state._hasHydrated);
  const setAuth = useStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const isWorking = useRef(false);

  const { data: session, isPending: isSessionPending } = useSession();

  useEffect(() => {
    // Wait for both Zustand hydration AND better-auth session check
    if (!_hasHydrated || isSessionPending) return;
    // Prevent double execution
    if (isWorking.current) return;

    const run = async () => {
      isWorking.current = true;

      try {
        // Case 1: We already have a backend JWT (guest login or previous session)
        if (token) {
          await routeToContent();
          return;
        }

        // Case 2: No JWT but we have a Google session — sync with backend
        if (session?.user?.email) {
          const res = await api.post('/auth/login', { email: session.user.email });
          const { accessToken, user } = res.data.data;
          setAuth(accessToken, user);
          // After setAuth, token state updates and this effect will re-run
          isWorking.current = false;
          return;
        }

        // Case 3: No auth at all → redirect to login
        router.push('/login');
      } catch (err) {
        console.error('Dashboard init error:', err);
        setError('Failed to load workspace. Please try again.');
        isWorking.current = false;
      }
    };

    const routeToContent = async () => {
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

        const t3 = await api.post(`/projects/${pId}/tasks`, { title: 'Design System Implementation', description: 'Create all base UI components.', status: 'DOING', priority: 'MEDIUM', labelIds: [l1.data.data.id] });
        await api.post(`/projects/${pId}/tasks`, { title: 'Wireframe Homepage', status: 'TODO', priority: 'HIGH', labelIds: [l1.data.data.id] });
        await api.post(`/projects/${pId}/tasks`, { title: 'Setup Next.js & Tailwind', status: 'TODO', priority: 'URGENT' });
        await api.post(`/projects/${pId}/tasks`, { title: 'Project Kickoff Meeting', status: 'COMPLETED', priority: 'LOW' });
        await api.post(`/tasks/${t3.data.data.id}/subtasks`, { title: 'Button Component', status: 'COMPLETED' });
        await api.post(`/tasks/${t3.data.data.id}/subtasks`, { title: 'Input Component', status: 'DOING' });
        await api.post(`/tasks/${t3.data.data.id}/comments`, { content: 'Make sure to follow the new brand guidelines closely on this one.' });
      }

      const firstWorkspace = workspaces[0];
      const pRes = await api.get(`/workspaces/${firstWorkspace.id}/projects`);
      const projects = pRes.data.data;

      if (projects.length === 0) {
        const newProj = await api.post(`/workspaces/${firstWorkspace.id}/projects`, { name: 'My First Project' });
        router.push(`/${firstWorkspace.id}/projects/${newProj.data.data.id}/board`);
      } else {
        router.push(`/${firstWorkspace.id}/projects/${projects[0].id}/board`);
      }
    };

    run();
  }, [token, _hasHydrated, isSessionPending, session, router, setAuth]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="glass p-8 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <p className="text-[var(--muted-foreground)] mb-6">{error}</p>
          <button
            onClick={() => { useStore.getState().logout(); router.push('/login'); }}
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
