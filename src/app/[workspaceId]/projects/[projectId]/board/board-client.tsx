"use client";

import { useTasks, useUpdateTaskStatus, useDeleteTask } from "@/lib/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Trash2,
  MoreHorizontal,
  GripVertical,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { TaskToolbar, FilterSortState } from "@/components/tasks/task-toolbar";
import { toast } from "sonner";

const COLUMNS = [
  { id: "TODO", title: "To Do", dot: "#94a3b8" },
  { id: "DOING", title: "In Progress", dot: "#3b82f6" },
  { id: "ON_HOLD", title: "On Hold", dot: "#f59e0b" },
  { id: "COMPLETED", title: "Done", dot: "#10b981" },
];

export function BoardClient() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: rawTasks, isLoading, refetch: refetchTasks } = useTasks(projectId);
  const updateTask = useUpdateTaskStatus(projectId);
  const deleteTask = useDeleteTask(projectId);
  const queryClient = useQueryClient();

  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState<{
    open: boolean;
    status: string;
  }>({ open: false, status: "TODO" });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [filterState, setFilterState] = useState<FilterSortState>({
    search: "",
    status: "",
    priority: "",
    sort: "",
  });

  useEffect(() => {
    if (rawTasks) setTasks(rawTasks);
  }, [rawTasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter((t) => !t.parentTaskId);

    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filterState.status) {
      result = result.filter((t) => t.status === filterState.status);
    }
    if (filterState.priority) {
      result = result.filter((t) => t.priority === filterState.priority);
    }

    if (filterState.sort) {
      result.sort((a, b) => {
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
      // Default manual sorting by position
      result.sort((a, b) => a.position - b.position);
    }

    return result;
  }, [tasks, filterState]);

  const onDragEnd = (result: any) => {
    // Disable drag and drop when sorted (except manual default) or filtered by status
    if (filterState.sort || filterState.status || filterState.search) {
      toast.error("Drag and drop is disabled while filtering or sorting.");
      return;
    }

    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex((t) => t.id === draggableId);
    const [movedTask] = newTasks.splice(taskIndex, 1);
    movedTask.status = destination.droppableId;

    const destTasks = newTasks
      .filter((t) => t.status === destination.droppableId && !t.parentTaskId)
      .sort((a, b) => a.position - b.position);
    destTasks.splice(destination.index, 0, movedTask);
    destTasks.forEach((t, i) => {
      t.position = i * 1024;
    });

    setTasks(
      newTasks
        .filter((t) => t.status !== destination.droppableId || t.parentTaskId)
        .concat(destTasks),
    );
    updateTask.mutate({
      taskId: draggableId,
      status: destination.droppableId,
      position: movedTask.position,
    });
  };

  const handleDelete = async (taskId: string) => {
    setOpenMenuId(null);
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
    <div
      className="p-6 h-full flex flex-col"
      onClick={() => setOpenMenuId(null)}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Board</h1>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCreateModal({ open: true, status: "TODO" });
          }}
          className="flex items-center justify-center gap-1.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <TaskToolbar state={filterState} onChange={setFilterState} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 flex-1 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredAndSortedTasks.filter(
              (t) => t.status === col.id,
            );

            return (
              <div key={col.id} className="flex flex-col w-[300px] shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1 text-[var(--foreground)]">
                  <GripVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <h3 className="font-semibold text-sm">{col.title}</h3>
                  <div className="ml-auto flex items-center gap-1 text-[var(--muted-foreground)]">
                    <button
                      onClick={() =>
                        setCreateModal({ open: true, status: col.id })
                      }
                      className="p-1 hover:bg-[var(--muted)] rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-[var(--muted)] rounded">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Droppable
                  droppableId={col.id}
                  isDropDisabled={
                    !!(
                      filterState.sort ||
                      filterState.status ||
                      filterState.search
                    )
                  }
                >
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 rounded-xl p-2 transition-colors min-h-[200px] bg-[var(--muted)]/40",
                        snapshot.isDraggingOver &&
                          "bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/30",
                      )}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={
                            !!(
                              filterState.sort ||
                              filterState.status ||
                              filterState.search
                            )
                          }
                        >
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...(provided.dragHandleProps as any)}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ y: -4, scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setSelectedTaskId(task.id);
                              }}
                              className={cn(
                                "bg-[var(--card)]/80 dark:bg-[var(--card)]/60 backdrop-blur-md p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-3 group cursor-pointer select-none relative transition-colors duration-200",
                                snapshot.isDragging
                                  ? "shadow-2xl border-[var(--primary)] ring-2 ring-[var(--primary)]/40 opacity-95 rotate-2 scale-105 z-50 bg-[var(--card)]"
                                  : "hover:border-[var(--primary)]/50 hover:shadow-lg hover:bg-[var(--card)]",
                              )}
                              style={{ ...provided.draggableProps.style }}
                            >
                              {/* Row 1: Title & Menu */}
                              <div className="flex items-start justify-between mb-4">
                                <h4 className="font-medium text-[15px] leading-snug group-hover:text-[var(--primary)] transition-colors pr-4">
                                  {task.title}
                                </h4>
                                <div className="relative shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(
                                        openMenuId === task.id ? null : task.id,
                                      );
                                    }}
                                    className="p-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] transition-opacity"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                  {openMenuId === task.id && (
                                    <div className="absolute right-0 top-7 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[130px]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(task.id);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />{" "}
                                        Delete Task
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Row 2: Assignee/Reporter & Date */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  {task.assignees?.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                      {task.assignees[0].avatarUrl ? (
                                        <img src={task.assignees[0].avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                                          {task.assignees[0].name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[80px]">
                                        {task.assignees[0].name}
                                      </span>
                                    </div>
                                  ) : task.reporter ? (
                                    <div className="flex items-center gap-2">
                                      {task.reporter.avatarUrl ? (
                                        <img src={task.reporter.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                                          {task.reporter.name?.charAt(0)}
                                        </div>
                                      )}
                                      <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[80px]">
                                        {task.reporter.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-[var(--muted-foreground)]">
                                      Unassigned
                                    </span>
                                  )}
                                </div>
                                {task.dueDate && (() => {
                                  const due = new Date(task.dueDate);
                                  const isOverdue = due < new Date();
                                  return (
                                    <div className={cn(
                                      "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border",
                                      isOverdue
                                        ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                                        : "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]"
                                    )}>
                                      <Calendar className="w-3.5 h-3.5" />
                                      {due.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Row 3: Labels */}
                              {task.labels?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {task.labels.map((label: any) => (
                                    <div
                                      key={label.id}
                                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                                      style={{ 
                                        backgroundColor: `${label.color}15`, 
                                        color: label.color,
                                        borderColor: `${label.color}30`
                                      }}
                                    >
                                      <Tag className="w-3 h-3" />
                                      {label.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {!filterState.search &&
                        !filterState.status &&
                        !filterState.priority &&
                        !filterState.sort && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreateModal({ open: true, status: col.id });
                            }}
                            className="w-full mt-1 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add task
                          </button>
                        )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <TaskDetailModal
        taskId={selectedTaskId}
        projectId={projectId}
        onClose={() => {
          setSelectedTaskId(null);
          refetchTasks();
        }}
      />
      <CreateTaskModal
        open={createModal.open}
        onClose={() => setCreateModal({ open: false, status: "TODO" })}
        defaultStatus={createModal.status}
      />
    </div>
  );
}
