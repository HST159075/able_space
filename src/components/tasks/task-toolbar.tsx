import { Search, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface FilterSortState {
  search: string;
  status: string;
  priority: string;
  sort: string;
}

interface TaskToolbarProps {
  state: FilterSortState;
  onChange: (state: FilterSortState) => void;
}

export function TaskToolbar({ state, onChange }: TaskToolbarProps) {
  const updateState = (key: keyof FilterSortState, value: string) => {
    onChange({ ...state, [key]: value });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search tasks..."
          value={state.search}
          onChange={(e) => updateState('search', e.target.value)}
          className="pl-9 h-10 bg-[var(--card)] border-[var(--border)] focus-visible:ring-1 focus-visible:ring-[var(--primary)] w-full shadow-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pb-2 sm:pb-0">
        <div className="relative group shrink-0">
          <button className="h-10 px-3 flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)]/50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-[var(--muted-foreground)]" />
            Status {state.status && <span className="w-2 h-2 rounded-full bg-[var(--primary)] ml-1" />}
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] ml-1" />
          </button>
          <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
            <button onClick={() => updateState('status', '')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.status === '' ? 'font-bold text-[var(--primary)]' : ''}`}>All Statuses</button>
            <button onClick={() => updateState('status', 'TODO')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.status === 'TODO' ? 'font-bold text-[var(--primary)]' : ''}`}>To Do</button>
            <button onClick={() => updateState('status', 'DOING')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.status === 'DOING' ? 'font-bold text-[var(--primary)]' : ''}`}>In Progress</button>
            <button onClick={() => updateState('status', 'ON_HOLD')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.status === 'ON_HOLD' ? 'font-bold text-[var(--primary)]' : ''}`}>On Hold</button>
            <button onClick={() => updateState('status', 'COMPLETED')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.status === 'COMPLETED' ? 'font-bold text-[var(--primary)]' : ''}`}>Completed</button>
          </div>
        </div>

        <div className="relative group shrink-0">
          <button className="h-10 px-3 flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)]/50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-[var(--muted-foreground)]" />
            Priority {state.priority && <span className="w-2 h-2 rounded-full bg-[var(--primary)] ml-1" />}
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] ml-1" />
          </button>
          <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
            <button onClick={() => updateState('priority', '')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.priority === '' ? 'font-bold text-[var(--primary)]' : ''}`}>All Priorities</button>
            <button onClick={() => updateState('priority', 'URGENT')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.priority === 'URGENT' ? 'font-bold text-[var(--primary)]' : ''}`}>Urgent</button>
            <button onClick={() => updateState('priority', 'HIGH')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.priority === 'HIGH' ? 'font-bold text-[var(--primary)]' : ''}`}>High</button>
            <button onClick={() => updateState('priority', 'NORMAL')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.priority === 'NORMAL' ? 'font-bold text-[var(--primary)]' : ''}`}>Normal</button>
            <button onClick={() => updateState('priority', 'LOW')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.priority === 'LOW' ? 'font-bold text-[var(--primary)]' : ''}`}>Low</button>
          </div>
        </div>

        <div className="relative group shrink-0">
          <button className="h-10 px-3 flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)]/50 transition-colors shadow-sm">
            <ArrowUpDown className="w-4 h-4 text-[var(--muted-foreground)]" />
            Sort
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] ml-1" />
          </button>
          <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
            <button onClick={() => updateState('sort', '')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.sort === '' ? 'font-bold text-[var(--primary)]' : ''}`}>Default (Manual)</button>
            <button onClick={() => updateState('sort', 'dueDateAsc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.sort === 'dueDateAsc' ? 'font-bold text-[var(--primary)]' : ''}`}>Due Date (Earliest)</button>
            <button onClick={() => updateState('sort', 'dueDateDesc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.sort === 'dueDateDesc' ? 'font-bold text-[var(--primary)]' : ''}`}>Due Date (Latest)</button>
            <button onClick={() => updateState('sort', 'priorityDesc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.sort === 'priorityDesc' ? 'font-bold text-[var(--primary)]' : ''}`}>Priority (High to Low)</button>
            <button onClick={() => updateState('sort', 'createdDesc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${state.sort === 'createdDesc' ? 'font-bold text-[var(--primary)]' : ''}`}>Recently Created</button>
          </div>
        </div>
      </div>
    </div>
  );
}
