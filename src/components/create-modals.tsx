'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateWorkspace, useCreateProject, useCreateTeam } from '@/lib/api';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// ─── Create Workspace ────────────────────────────────────────────
export function CreateWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const create = useCreateWorkspace();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync(name.trim());
      toast.success('Workspace created!');
      setName('');
      onClose();
    } catch {
      toast.error('Failed to create workspace.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Workspace" size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Workspace Name</label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim() || create.isPending}>{create.isPending ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Create Team ─────────────────────────────────────────────────
export function CreateTeamModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [name, setName] = useState('');
  const create = useCreateTeam(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync(name.trim());
      toast.success('Team created!');
      setName('');
      onClose();
    } catch {
      toast.error('Failed to create team.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Team" size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Team Name</label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim() || create.isPending}>{create.isPending ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Create Project ───────────────────────────────────────────────
export function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('NO_PRIORITY');
  const [dueDate, setDueDate] = useState('');
  const create = useCreateProject(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), priority: priority as any, dueDate: dueDate || undefined });
      toast.success('Project created!');
      setName(''); setPriority('NO_PRIORITY'); setDueDate('');
      onClose();
    } catch {
      toast.error('Failed to create project.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project" size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Project Name</label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            {['NO_PRIORITY','LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p.replace('_',' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Due Date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim() || create.isPending}>{create.isPending ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
