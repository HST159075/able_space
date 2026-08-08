import { cn } from '@/lib/utils';

const priorityConfig: Record<string, { label: string; className: string }> = {
  NO_PRIORITY: { label: 'No Priority', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800' },
  LOW:         { label: 'Low',         className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  NORMAL:      { label: 'Normal',      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  MEDIUM:      { label: 'Medium',      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  HIGH:        { label: 'High',        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  URGENT:      { label: 'Urgent',      className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  BACKLOG:   { label: 'Backlog',     className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  TODO:      { label: 'To Do',       className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  DOING:     { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  ON_HOLD:   { label: 'On Hold',     className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  COMPLETED: { label: 'Done',        className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority] ?? priorityConfig.NO_PRIORITY;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.TODO;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  );
}
