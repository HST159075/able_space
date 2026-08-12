'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTask, useLabels } from '@/lib/api';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const PRIORITIES = [
  { value: 'NO_PRIORITY', label: 'No Priority', color: 'bg-gray-400' },
  { value: 'LOW',         label: 'Low',         color: 'bg-blue-500' },
  { value: 'MEDIUM',      label: 'Medium',      color: 'bg-yellow-500' },
  { value: 'HIGH',        label: 'High',        color: 'bg-orange-500' },
  { value: 'URGENT',      label: 'Urgent',      color: 'bg-red-500' },
];

const STATUSES = [
  { value: 'TODO',      label: 'To Do' },
  { value: 'DOING',     label: 'In Progress' },
  { value: 'ON_HOLD',   label: 'On Hold' },
  { value: 'COMPLETED', label: 'Done' },
];

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: string;
}

export function CreateTaskModal({ open, onClose, defaultStatus = 'TODO' }: CreateTaskModalProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const workspaceId = params.workspaceId as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState(defaultStatus);
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const createTask = useCreateTask(projectId);
  const { data: labels } = useLabels(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
        labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
      });
      toast.success('Task created!');
      setTitle(''); setDescription(''); setPriority('MEDIUM');
      setStatus(defaultStatus); setDueDate(''); setSelectedLabels([]);
      onClose();
    } catch {
      toast.error('Failed to create task.');
    }
  };

  const toggleLabel = (id: string) => {
    setSelectedLabels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Task" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Title <span className="text-red-500">*</span></label>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="h-11 text-base"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[80px] resize-none"
          />
        </div>

        {/* Status & Priority row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Due Date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        {/* Labels */}
        {labels?.length > 0 && (
          <div>
            <label className="text-sm font-medium block mb-2">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label: any) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium text-white transition-all',
                    selectedLabels.includes(label.id) ? 'ring-2 ring-offset-1 ring-[var(--foreground)] scale-105' : 'opacity-70 hover:opacity-100'
                  )}
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createTask.isPending || !title.trim()}>
            {createTask.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
