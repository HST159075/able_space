"use client";

import { useTasks, useDeleteTask } from "@/lib/api";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Plus, Calendar, ChevronRight, Trash2 } from "lucide-react";
import { TaskToolbar, FilterSortState } from "@/components/tasks/task-toolbar";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function ListClient() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: tasks, isLoading } = useTasks(projectId);
  const deleteTask = useDeleteTask(projectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(
    new Set(),
  );

  const [filterState, setFilterState] = useState<FilterSortState>({
    search: "",
    status: "",
    priority: "",
    sort: "",
  });

  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];
    let result = tasks.filter((t: any) => !t.parentTaskId);

    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      result = result.filter((t: any) => t.title.toLowerCase().includes(q));
    }
    if (filterState.status) {
      result = result.filter((t: any) => t.status === filterState.status);
    }
    if (filterState.priority) {
      result = result.filter((t: any) => t.priority === filterState.priority);
    }

    if (filterState.sort) {
      result.sort((a: any, b: any) => {
        if (filterState.sort === "dueDateAsc") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (filterState.sort === "dueDateDesc") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        if (filterState.sort === "priorityDesc") {
          const pMap: any = {
            URGENT: 4,
            HIGH: 3,
            NORMAL: 2,
            LOW: 1,
            NO_PRIORITY: 0,
          };
          return (
            (pMap[b.priority || "NO_PRIORITY"] || 0) -
            (pMap[a.priority || "NO_PRIORITY"] || 0)
          );
        }
        if (filterState.sort === "createdDesc") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0;
      });
    } else {
      result.sort((a: any, b: any) => a.position - b.position);
    }

    return result;
  }, [tasks, filterState]);

  const toggleSubtasks = (id: string) => {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task deleted.");
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">List View</h1>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center justify-center gap-1.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <TaskToolbar state={filterState} onChange={setFilterState} />

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--muted)]/50 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          <span>Task</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Due Date</span>
          <span></span>
        </div>

        {filteredAndSortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)]">
            <p className="text-sm">No tasks found.</p>
            {!filterState.search &&
              !filterState.status &&
              !filterState.priority && (
                <button
                  onClick={() => setCreateModal(true)}
                  className="mt-3 text-sm text-[var(--primary)] flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Create your first task
                </button>
              )}
          </div>
        )}

        {filteredAndSortedTasks.map((task: any, index: number) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            {/* Task row */}
            <div
              onClick={() => setSelectedTaskId(task.id)}
              className={cn(
                "grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-4 py-3 cursor-pointer hover:bg-[var(--muted)]/40 transition-colors items-center group",
                index !== filteredAndSortedTasks.length - 1 &&
                  "border-b border-[var(--border)]",
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {task.subtasks?.length > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtasks(task.id);
                    }}
                    className="p-0.5 hover:bg-[var(--border)] rounded text-[var(--muted-foreground)]"
                  >
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        expandedSubtasks.has(task.id) && "rotate-90",
                      )}
                    />
                  </button>
                ) : (
                  <div className="w-5" />
                )}

                <span className="font-medium text-sm truncate group-hover:text-[var(--primary)] transition-colors">
                  {task.title}
                </span>

                {task.labels?.map((label: any) => (
                  <span
                    key={label.id}
                    className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white shrink-0"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>

              <div>
                <StatusBadge status={task.status} />
              </div>
              <div>
                <PriorityBadge priority={task.priority} />
              </div>

              <div className="text-xs text-[var(--muted-foreground)]">
                {task.dueDate ? (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      new Date(task.dueDate) < new Date() && "text-red-500",
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ) : (
                  <span>—</span>
                )}
              </div>

              <button
                onClick={(e) => handleDelete(e, task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--muted-foreground)] hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtask rows */}
            {expandedSubtasks.has(task.id) &&
              task.subtasks?.map((sub: any) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedTaskId(sub.id)}
                  className="grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-4 py-2.5 cursor-pointer hover:bg-[var(--muted)]/30 transition-colors items-center border-b border-[var(--border)] bg-[var(--muted)]/10"
                >
                  <div className="flex items-center gap-2 pl-10 min-w-0">
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <span className="text-sm text-[var(--muted-foreground)] truncate">
                      {sub.title}
                    </span>
                  </div>
                  <div>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div>
                    <PriorityBadge priority={sub.priority ?? "NO_PRIORITY"} />
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    —
                  </div>
                  <div />
                </div>
              ))}
          </motion.div>
        ))}
      </div>

      <TaskDetailModal
        taskId={selectedTaskId}
        projectId={projectId}
        onClose={() => setSelectedTaskId(null)}
      />
      <CreateTaskModal
        open={createModal}
        onClose={() => setCreateModal(false)}
      />
    </div>
  );
}
