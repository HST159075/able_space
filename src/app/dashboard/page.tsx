'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/axios';

export default function DashboardRedirect() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const [error, setError] = useState<string | null>(null);
  const isSeeding = React.useRef(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const routeToContent = async () => {
      if (isSeeding.current) return;
      
      try {
        isSeeding.current = true;
        // Fetch workspaces
        const wsRes = await api.get('/workspaces');
        let workspaces = wsRes.data.data;
        
        if (workspaces.length === 0) {
          // Comprehensive Demo Data Seeding
          const newWs = await api.post('/workspaces', { name: 'Acme Corp' });
          const wsId = newWs.data.data.id;
          workspaces = [newWs.data.data];

          // Create Teams
          await api.post(`/workspaces/${wsId}/teams`, { name: 'Engineering' });
          await api.post(`/workspaces/${wsId}/teams`, { name: 'Design' });

          // Create Labels
          const l1 = await api.post(`/workspaces/${wsId}/labels`, { name: 'Feature', color: '#3b82f6' });
          const l2 = await api.post(`/workspaces/${wsId}/labels`, { name: 'Bug', color: '#ef4444' });

          // Create Project
          const newProj = await api.post(`/workspaces/${wsId}/projects`, { name: 'Website Redesign' });
          const pId = newProj.data.data.id;

          // Create Tasks
          const t1 = await api.post(`/projects/${pId}/tasks`, { title: 'Wireframe Homepage', status: 'TODO', priority: 'HIGH', labelIds: [l1.data.data.id] });
          const t2 = await api.post(`/projects/${pId}/tasks`, { title: 'Setup Next.js & Tailwind', status: 'TODO', priority: 'URGENT' });
          const t3 = await api.post(`/projects/${pId}/tasks`, { title: 'Design System Implementation', description: 'Create all base UI components.', status: 'DOING', priority: 'MEDIUM', labelIds: [l1.data.data.id] });
          const t4 = await api.post(`/projects/${pId}/tasks`, { title: 'Project Kickoff Meeting', status: 'COMPLETED', priority: 'LOW' });

          // Add Subtasks and Comments to t3
          await api.post(`/tasks/${t3.data.data.id}/subtasks`, { title: 'Button Component', status: 'COMPLETED' });
          await api.post(`/tasks/${t3.data.data.id}/subtasks`, { title: 'Input Component', status: 'DOING' });
          await api.post(`/tasks/${t3.data.data.id}/comments`, { content: 'Make sure to follow the new brand guidelines closely on this one.' });
        }
        
        const firstWorkspace = workspaces[0];
        
        // Fetch projects for that workspace
        const pRes = await api.get(`/workspaces/${firstWorkspace.id}/projects`);
        const projects = pRes.data.data;

        // Redirect to the first project's Kanban board
        router.push(`/${firstWorkspace.id}/projects/${projects[0].id}/board`);

      } catch (err) {
        console.error(err);
        setError("Failed to fetch dashboard data.");
      }
    };

    routeToContent();
  }, [token, router]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="glass p-8 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">AbleSpace Setup</h2>
          <p className="text-[var(--muted-foreground)] mb-6">{error}</p>
          <button 
            onClick={() => { useStore.getState().logout(); router.push('/login') }}
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
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--muted-foreground)]">Loading your workspace...</p>
      </div>
    </div>
  );
}
