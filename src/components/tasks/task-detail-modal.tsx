"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useWorkspace, useLabels, useTeams, useCreateLabel } from "@/lib/api";
import {
  Calendar,
  MessageSquare,
  Activity,
  Flag,
  CheckSquare,
  Send,
  Lock,
  Eye,
  Share2,
  MoreHorizontal,
  PanelRight,
  ChevronDown,
  Plus,
  Settings,
  ChevronRight,
  Tag,
  Paperclip,
  Smile,
  UserCircle2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  taskId: string | null;
  projectId: string;
  onClose: () => void;
}

const PRIORITIES = [
  {
    value: "NO_PRIORITY",
    label: "No Priority",
    icon: "signal",
    color: "text-gray-400",
  },
  { value: "LOW", label: "Low", icon: "signal-low", color: "text-blue-500" },
  {
    value: "MEDIUM",
    label: "Medium",
    icon: "signal-medium",
    color: "text-yellow-500",
  },
  { value: "HIGH", label: "High", icon: "signal-high", color: "text-orange-500" },
  {
    value: "URGENT",
    label: "Urgent",
    icon: "signal-full",
    color: "text-red-600",
  },
];

const STATUSES = [
  { value: "BACKLOG", label: "Backlog", dot: "#f59e0b" },
  { value: "TODO", label: "To Do", dot: "#94a3b8" },
  { value: "DOING", label: "In Progress", dot: "#3b82f6" },
  { value: "ON_HOLD", label: "On Hold", dot: "#f97316" },
  { value: "COMPLETED", label: "Done", dot: "#10b981" },
];

export function TaskDetailModal({
  taskId,
  projectId,
  onClose,
}: TaskDetailModalProps) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [updatesExpanded, setUpdatesExpanded] = useState(true);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [membersMenuOpen, setMembersMenuOpen] = useState(false);
  const [labelsMenuOpen, setLabelsMenuOpen] = useState(false);
  const [teamsMenuOpen, setTeamsMenuOpen] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: workspaceLabels } = useLabels(workspaceId);
  const { data: workspaceTeams } = useTeams(workspaceId);
  const createLabel = useCreateLabel(workspaceId);
  const [newLabelName, setNewLabelName] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/tasks/${taskId}`);
      return res.data.data;
    },
    enabled: !!taskId,
  });

  const { data: activity } = useQuery({
    queryKey: ["activity", taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/activity`);
      return res.data.data;
    },
    enabled: !!taskId,
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/comments`);
      return res.data.data;
    },
    enabled: !!taskId,
  });

  const nestedComments = useMemo(() => {
    if (!comments) return [];
    const map = new Map();
    const roots: any[] = [];
    comments.forEach((c: any) => map.set(c.id, { ...c, replies: [] }));
    comments.forEach((c: any) => {
      if (c.parentCommentId) {
        const parent = map.get(c.parentCommentId);
        if (parent) parent.replies.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });
    return roots;
  }, [comments]);

  const updateTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(
        `/projects/${projectId}/tasks/${taskId}`,
        data,
      );
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
      // Only show toast for non-label/non-team/non-assignee updates
      const silentKeys = ['labelIds', 'assigneeIds', 'teamIds'];
      const isSilent = Object.keys(variables).some(k => silentKeys.includes(k));
      if (!isSilent) toast.success("Task updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update task");
    },
  });

  const addComment = useMutation({
    mutationFn: async (payload?: {
      content: string;
      parentCommentId?: string;
    }) => {
      const contentStr = payload?.content || comment;
      if (!contentStr.trim()) return;
      const data: any = { content: contentStr.trim() };
      if (payload?.parentCommentId)
        data.parentCommentId = payload.parentCommentId;
      else if (replyingTo) data.parentCommentId = replyingTo;

      const res = await api.post(`/tasks/${taskId}/comments`, data);
      return res.data.data;
    },
    onSuccess: () => {
      setComment("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment added");
    },
  });

  const addSubtask = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post(`/tasks/${taskId}/subtasks`, {
        title,
        status: "TODO",
      });
      return res.data.data;
    },
    onSuccess: () => {
      setSubtaskTitle("");
      setAddingSubtask(false);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Subtask added");
    },
  });

  if (!taskId) return null;

  const currentPriority =
    PRIORITIES.find((p) => p.value === task?.priority) || PRIORITIES[0];
  const currentStatus =
    STATUSES.find((s) => s.value === task?.status) || STATUSES[1];

  return (
    <Modal open={!!taskId} onClose={onClose} size="full">
      {isLoading || !task ? (
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div
          className="flex flex-col h-full bg-white dark:bg-[#09090b] rounded-2xl overflow-hidden"
          onClick={() => {
            setPriorityMenuOpen(false);
            setStatusMenuOpen(false);
            setMembersMenuOpen(false);
            setLabelsMenuOpen(false);
            setTeamsMenuOpen(false);
          }}
        >
          {/* Top Bar inside modal */}
          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Left Column (Main Content) */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-[50vh]">
              {/* Header inside left column */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)] shrink-0 sticky top-0 bg-white dark:bg-[#09090b] z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                  <h1 className="text-2xl font-bold truncate text-[var(--foreground)]">
                    {task.title}
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[var(--muted-foreground)]">
                  <button className="p-2 hover:bg-[var(--muted)] rounded-md transition-colors">
                    <Lock className="w-4 h-4" />
                  </button>
                  <button className="px-2.5 py-1.5 hover:bg-[var(--muted)] rounded-md transition-colors flex items-center gap-1.5 text-sm font-medium">
                    <Eye className="w-4 h-4" /> 1
                  </button>
                  <button className="p-2 hover:bg-[var(--muted)] rounded-md transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-[var(--muted)] rounded-md transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-[var(--border)] mx-1" />
                  <button
                    onClick={() => setSidePanelOpen(!sidePanelOpen)}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      sidePanelOpen
                        ? "bg-[var(--muted)] text-[var(--foreground)]"
                        : "hover:bg-[var(--muted)]",
                    )}
                  >
                    <PanelRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Content Body */}
              <div className="p-8 space-y-10 flex-1">
                {/* Description */}
                <div>
                  <textarea
                    className="w-full bg-transparent text-[15px] text-[var(--muted-foreground)] resize-none focus:outline-none focus:text-[var(--foreground)] transition-colors min-h-[60px]"
                    defaultValue={task.description || ""}
                    placeholder="Create clear and detailed description..."
                    onBlur={(e) => {
                      if (e.target.value !== (task.description || ""))
                        updateTask.mutate({ description: e.target.value });
                    }}
                  />
                </div>

                {/* Grid Properties */}
                <div className="grid grid-cols-[100px_1fr] gap-y-4 items-center">
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">
                    Properties
                  </div>
                  <div className="flex items-center gap-4">
                    {task.assignees?.length > 0 ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--muted)] rounded-md text-sm font-medium">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">
                          {task.assignees[0].name?.charAt(0)}
                        </div>
                        {task.assignees[0].name}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--muted)] rounded-md text-sm text-[var(--muted-foreground)]">
                        <UserCircle2 className="w-4 h-4" /> Unassigned
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/50">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(task.dueDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-medium text-[var(--muted-foreground)]">
                    Labels
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.labels?.length > 0 ? (
                      task.labels.map((label: any) => (
                        <div
                          key={label.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--muted)] text-sm font-medium border border-[var(--border)]"
                        >
                          <Tag
                            className="w-3.5 h-3.5 text-[var(--muted-foreground)]"
                            style={{ color: label.color }}
                          />
                          {label.name}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)] italic">
                        No labels
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium text-[var(--muted-foreground)]">
                    Resources
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="@ Add document or link..."
                      className="bg-transparent text-sm focus:outline-none w-full text-[var(--muted-foreground)]"
                    />
                  </div>
                </div>

                {/* Subtasks Accordion */}
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-2 px-4 py-3 bg-[var(--muted)]/50 border-b border-[var(--border)] cursor-pointer select-none"
                    onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-[var(--muted-foreground)] transition-transform",
                        !subtasksExpanded && "-rotate-90",
                      )}
                    />
                    <span className="font-semibold text-sm">Subtasks</span>
                  </div>

                  {subtasksExpanded && (
                    <div className="bg-[var(--card)]">
                      <div className="grid grid-cols-[minmax(150px,2fr)_1fr_1fr_1fr_60px] gap-4 px-4 py-2.5 border-b border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                        <span>Task</span>
                        <span>Priority</span>
                        <span>Members</span>
                        <span>Due Date</span>
                        <span>Actions</span>
                      </div>

                      {task.subtasks?.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                          No subtasks yet.
                        </div>
                      ) : (
                        task.subtasks?.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="grid grid-cols-[minmax(150px,2fr)_1fr_1fr_1fr_60px] gap-4 px-4 py-3 border-b border-[var(--border)] items-center text-sm"
                          >
                            <div className="flex items-center gap-2 font-medium">
                              <input
                                type="checkbox"
                                checked={sub.status === "COMPLETED"}
                                onChange={async (e) => {
                                  await api.patch(
                                    `/projects/${projectId}/tasks/${sub.id}`,
                                    {
                                      status: e.target.checked
                                        ? "COMPLETED"
                                        : "TODO",
                                    },
                                  );
                                  queryClient.invalidateQueries({
                                    queryKey: ["task", taskId],
                                  });
                                }}
                                className="w-4 h-4 cursor-pointer accent-[var(--primary)]"
                              />
                              <span
                                className={
                                  sub.status === "COMPLETED"
                                    ? "line-through text-[var(--muted-foreground)]"
                                    : ""
                                }
                              >
                                {sub.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {sub.priority === "HIGH" ||
                                sub.priority === "URGENT" ? (
                                <span className="text-red-500 font-medium flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 rounded-sm bg-red-500/20 flex items-end p-[1px] gap-[1px]">
                                    <div className="w-[2px] h-[3px] bg-red-500"></div>
                                    <div className="w-[2px] h-[5px] bg-red-500"></div>
                                    <div className="w-[2px] h-[7px] bg-red-500"></div>
                                  </div>
                                  {sub.priority.replace("_", " ")}
                                </span>
                              ) : sub.priority === "MEDIUM" ? (
                                <span className="text-yellow-600 font-medium flex items-center gap-1">
                                  <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500/20 flex items-end p-[1px] gap-[1px]">
                                    <div className="w-[2px] h-[3px] bg-yellow-500"></div>
                                    <div className="w-[2px] h-[5px] bg-yellow-500"></div>
                                    <div className="w-[2px] h-[7px] bg-transparent"></div>
                                  </div>
                                  Medium
                                </span>
                              ) : (
                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                  Low
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border border-white flex items-center justify-center text-[10px] text-white font-bold">
                                C
                              </div>
                            </div>
                            <div className="text-[var(--muted-foreground)]">
                              12 Sep 2026
                            </div>
                            <div>
                              <MoreHorizontal className="w-4 h-4 text-[var(--muted-foreground)] cursor-pointer" />
                            </div>
                          </div>
                        ))
                      )}
                      <div className="px-4 py-2.5">
                        {addingSubtask ? (
                          <div className="flex items-center gap-2">
                            <input
                              ref={subtaskInputRef}
                              autoFocus
                              value={subtaskTitle}
                              onChange={(e) => setSubtaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && subtaskTitle.trim())
                                  addSubtask.mutate(subtaskTitle.trim());
                                if (e.key === "Escape") {
                                  setAddingSubtask(false);
                                  setSubtaskTitle("");
                                }
                              }}
                              placeholder="Subtask title..."
                              className="flex-1 bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                            <button
                              onClick={() => {
                                if (subtaskTitle.trim())
                                  addSubtask.mutate(subtaskTitle.trim());
                              }}
                              className="px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg font-medium hover:opacity-90"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setAddingSubtask(false);
                                setSubtaskTitle("");
                              }}
                              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAddingSubtask(true);
                              setTimeout(
                                () => subtaskInputRef.current?.focus(),
                                50,
                              );
                            }}
                            className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add Subtask
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comments
                  </h3>

                  <div className="space-y-4">
                    {nestedComments?.map((c: any) => {
                      const renderComment = (c: any, isReply = false) => (
                        <div
                          key={c.id}
                          className={cn(isReply ? "ml-8 mt-3" : "mt-4")}
                        >
                          <div
                            className={cn(
                              "border border-[var(--border)] rounded-xl p-4 bg-white dark:bg-[var(--card)] shadow-sm",
                              isReply ? "bg-[var(--muted)]/20" : "",
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                  {c.author?.name?.charAt(0) || "U"}
                                </div>
                                <span className="font-semibold text-sm">
                                  {c.author?.name || "User"}
                                </span>
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {c.createdAt
                                    ? format(
                                      new Date(c.createdAt),
                                      "MMM d, h:mm a",
                                    )
                                    : "just now"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                                <button
                                  onClick={() => {
                                    setReplyingTo(
                                      replyingTo === c.id ? null : c.id,
                                    );
                                    setComment("");
                                  }}
                                  className="text-xs hover:text-[var(--primary)] transition-colors"
                                >
                                  Reply
                                </button>
                                <MoreHorizontal className="w-4 h-4 cursor-pointer" />
                              </div>
                            </div>
                            <p className="text-sm text-[var(--foreground)] leading-relaxed pl-8">
                              {c.content}
                            </p>
                          </div>

                          {replyingTo === c.id && (
                            <div className="mt-3 pl-8">
                              <div className="border border-[var(--border)] rounded-xl p-3 bg-white dark:bg-[var(--card)] flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                  R
                                </div>
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="Write a reply..."
                                  className="flex-1 bg-transparent text-sm focus:outline-none"
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && comment.trim())
                                      addComment.mutate({
                                        content: comment.trim(),
                                        parentCommentId: c.id,
                                      });
                                    if (e.key === "Escape") {
                                      setReplyingTo(null);
                                      setComment("");
                                    }
                                  }}
                                />
                                <Send
                                  className={cn(
                                    "w-4 h-4 cursor-pointer",
                                    comment.trim()
                                      ? "text-[var(--primary)]"
                                      : "text-[var(--muted-foreground)]",
                                  )}
                                  onClick={() => {
                                    if (comment.trim())
                                      addComment.mutate({
                                        content: comment.trim(),
                                        parentCommentId: c.id,
                                      });
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {c.replies?.length > 0 && (
                            <div className="space-y-1 relative">
                              <div className="absolute left-3 top-0 bottom-6 w-px bg-[var(--border)]" />
                              {c.replies.map((reply: any) =>
                                renderComment(reply, true),
                              )}
                            </div>
                          )}
                        </div>
                      );
                      return renderComment(c);
                    })}

                    {!replyingTo && (
                      <div className="border border-[var(--border)] rounded-xl p-3 bg-white dark:bg-[var(--card)] flex items-center gap-3 mt-6">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--primary)] to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          M
                        </div>
                        <input
                          type="text"
                          placeholder="Leave a comment..."
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && comment.trim())
                              addComment.mutate({ content: comment.trim() });
                          }}
                        />
                        <Paperclip className="w-4 h-4 text-[var(--muted-foreground)] cursor-pointer" />
                        <Send
                          className={cn(
                            "w-4 h-4 cursor-pointer",
                            comment.trim()
                              ? "text-[var(--primary)]"
                              : "text-[var(--muted-foreground)]",
                          )}
                          onClick={() => {
                            if (comment.trim())
                              addComment.mutate({ content: comment.trim() });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Side Panel) */}
            {sidePanelOpen && (
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[var(--border)] bg-[var(--card)] shrink-0 flex flex-col h-auto md:h-full overflow-y-visible md:overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Details Accordion */}
                  <div className="border border-[var(--border)] rounded-xl overflow-visible bg-white dark:bg-[var(--card)] shadow-sm">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      onClick={() => setDetailsExpanded(!detailsExpanded)}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-[var(--muted-foreground)] transition-transform",
                            !detailsExpanded && "-rotate-90",
                          )}
                        />
                        <span className="font-semibold text-sm">Details</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                        <Plus
                          className="w-4 h-4 hover:text-[var(--foreground)]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Settings
                          className="w-4 h-4 hover:text-[var(--foreground)]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {detailsExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Status */}
                        <div className="grid grid-cols-[100px_1fr] items-center py-1">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Status
                          </span>
                          <div className="relative">
                            <div
                              className="flex items-center gap-2 cursor-pointer hover:bg-[var(--muted)] p-1 -ml-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusMenuOpen(!statusMenuOpen);
                                setPriorityMenuOpen(false);
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: currentStatus.dot }}
                              ></div>
                              <span
                                className="text-sm font-medium"
                                style={{ color: currentStatus.dot }}
                              >
                                {currentStatus.label}
                              </span>
                            </div>
                            {statusMenuOpen && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50">
                                <div className="px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
                                  Status
                                </div>
                                {STATUSES.map((s) => (
                                  <div
                                    key={s.value}
                                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--muted)] cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTask.mutate({ status: s.value });
                                      setStatusMenuOpen(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: s.dot }}
                                      ></div>
                                      <span style={{ color: s.dot }}>
                                        {s.label}
                                      </span>
                                    </div>
                                    {currentStatus.value === s.value && (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Priority */}
                        <div className="grid grid-cols-[100px_1fr] items-center py-1">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Priority
                          </span>
                          <div className="relative">
                            <div
                              className="flex items-center gap-2 cursor-pointer hover:bg-[var(--muted)] p-1 -ml-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPriorityMenuOpen(!priorityMenuOpen);
                                setStatusMenuOpen(false);
                              }}
                            >
                              <span
                                className={cn(
                                  "text-sm font-medium flex items-center gap-1.5",
                                  currentPriority.color,
                                )}
                              >
                                {/* Fake Signal Icon based on level */}
                                <div
                                  className={cn(
                                    "flex items-end gap-[1px]",
                                    currentPriority.color,
                                  )}
                                >
                                  <div className="w-[3px] h-[4px] bg-current"></div>
                                  <div
                                    className={cn(
                                      "w-[3px] h-[7px]",
                                      currentPriority.value !== "NO_PRIORITY"
                                        ? "bg-current"
                                        : "bg-current opacity-30",
                                    )}
                                  ></div>
                                  <div
                                    className={cn(
                                      "w-[3px] h-[10px]",
                                      ["MEDIUM", "HIGH", "URGENT"].includes(
                                        currentPriority.value,
                                      )
                                        ? "bg-current"
                                        : "bg-current opacity-30",
                                    )}
                                  ></div>
                                  <div
                                    className={cn(
                                      "w-[3px] h-[13px]",
                                      ["HIGH", "URGENT"].includes(
                                        currentPriority.value,
                                      )
                                        ? "bg-current"
                                        : "bg-current opacity-30",
                                    )}
                                  ></div>
                                </div>
                                {currentPriority.label}
                                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                              </span>
                            </div>

                            {priorityMenuOpen && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50">
                                <div className="px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
                                  Priority
                                </div>
                                {PRIORITIES.map((p) => (
                                  <div
                                    key={p.value}
                                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--muted)] cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTask.mutate({ priority: p.value });
                                      setPriorityMenuOpen(false);
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "flex items-center gap-2",
                                        p.color,
                                      )}
                                    >
                                      <div className="flex items-end gap-[1px]">
                                        <div className="w-[3px] h-[4px] bg-current"></div>
                                        <div
                                          className={cn(
                                            "w-[3px] h-[7px]",
                                            p.value !== "NO_PRIORITY"
                                              ? "bg-current"
                                              : "bg-current opacity-30",
                                          )}
                                        ></div>
                                        <div
                                          className={cn(
                                            "w-[3px] h-[10px]",
                                            [
                                              "MEDIUM",
                                              "HIGH",
                                              "URGENT",
                                            ].includes(p.value)
                                              ? "bg-current"
                                              : "bg-current opacity-30",
                                          )}
                                        ></div>
                                        <div
                                          className={cn(
                                            "w-[3px] h-[13px]",
                                            ["HIGH", "URGENT"].includes(p.value)
                                              ? "bg-current"
                                              : "bg-current opacity-30",
                                          )}
                                        ></div>
                                      </div>
                                      <span>{p.label}</span>
                                    </div>
                                    {currentPriority.value === p.value && (
                                      <Check className="w-3.5 h-3.5 text-[var(--foreground)]" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Members */}
                        <div className="grid grid-cols-[100px_1fr] items-center py-1">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Members
                          </span>
                          <div className="relative">
                            <div
                              className="text-sm font-medium cursor-pointer p-1 -ml-1 rounded hover:bg-[var(--muted)] flex flex-wrap gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMembersMenuOpen(!membersMenuOpen);
                              }}
                            >
                              {task.assignees?.length > 0
                                ? task.assignees.map((a: any) => (
                                  <span
                                    key={a.id}
                                    className="bg-[var(--primary)] text-[var(--primary-foreground)] px-2 py-0.5 rounded-full text-xs"
                                  >
                                    {a.name}
                                  </span>
                                ))
                                : "Add members..."}
                            </div>
                            {membersMenuOpen && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                                {workspace?.members?.map((m: any) => {
                                  const isSelected = task.assignees?.some(
                                    (a: any) => a.id === m.id,
                                  );
                                  return (
                                    <div
                                      key={m.id}
                                      className="px-3 py-2 text-sm hover:bg-[var(--muted)] cursor-pointer flex items-center justify-between"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIds =
                                          task.assignees?.map(
                                            (a: any) => a.id,
                                          ) || [];
                                        const newIds = isSelected
                                          ? currentIds.filter(
                                            (id: string) => id !== m.id,
                                          )
                                          : [...currentIds, m.id];
                                        updateTask.mutate({
                                          assigneeIds: newIds,
                                        });
                                      }}
                                    >
                                      {m.name}
                                      {isSelected && (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-[100px_1fr] items-center py-1">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Dates
                          </span>
                          <input
                            type="date"
                            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer hover:bg-[var(--muted)] p-1 -ml-1 rounded"
                            value={
                              task.dueDate ? task.dueDate.substring(0, 10) : ""
                            }
                            onChange={(e) =>
                              updateTask.mutate({ dueDate: e.target.value })
                            }
                          />
                        </div>

                        {/* Labels */}
                        <div className="grid grid-cols-[100px_1fr] items-center py-1 relative">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Labels
                          </span>
                          <div className="relative">
                            <div
                              className="text-sm font-medium cursor-pointer p-1 -ml-1 rounded hover:bg-[var(--muted)] flex flex-wrap gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLabelsMenuOpen(!labelsMenuOpen);
                              }}
                            >
                              {task.labels?.length > 0
                                ? task.labels.map((l: any) => (
                                  <span
                                    key={l.id}
                                    className="px-2 py-0.5 rounded text-white text-xs"
                                    style={{ backgroundColor: l.color }}
                                  >
                                    {l.name}
                                  </span>
                                ))
                                : <span className="text-[var(--muted-foreground)]">Add labels...</span>}
                            </div>
                            {labelsMenuOpen && (
                              <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-2 z-[60] flex flex-col">
                                <div className="px-2 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Search or create..."
                                      value={newLabelName}
                                      onChange={(e) => setNewLabelName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (newLabelName.trim()) {
                                            const existing = workspaceLabels?.find((wl: any) => wl.name.toLowerCase() === newLabelName.trim().toLowerCase());
                                            if (existing) {
                                              const currentIds = task.labels?.map((lbl: any) => lbl.id) || [];
                                              if (!currentIds.includes(existing.id)) {
                                                updateTask.mutate({ labelIds: [...currentIds, existing.id] });
                                              }
                                              setNewLabelName("");
                                            } else {
                                              createLabel.mutate(
                                                { name: newLabelName.trim(), color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') },
                                                {
                                                  onSuccess: (newLabel: any) => {
                                                    setNewLabelName("");
                                                    if (newLabel && newLabel.id) {
                                                      const currentIds = task.labels?.map((lbl: any) => lbl.id) || [];
                                                      updateTask.mutate({ labelIds: [...currentIds, newLabel.id] });
                                                    }
                                                  }
                                                }
                                              );
                                            }
                                          }
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 h-8 rounded-md border border-[var(--border)] bg-[var(--muted)]/50 px-2 text-xs placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                      autoFocus
                                    />
                                    {newLabelName.trim() && !workspaceLabels?.some((wl: any) => wl.name.toLowerCase() === newLabelName.trim().toLowerCase()) && (
                                      <button
                                        type="button"
                                        disabled={createLabel.isPending}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          createLabel.mutate(
                                            { name: newLabelName.trim(), color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') },
                                            {
                                              onSuccess: (newLabel: any) => {
                                                setNewLabelName("");
                                                if (newLabel && newLabel.id) {
                                                  const currentIds = task.labels?.map((lbl: any) => lbl.id) || [];
                                                  updateTask.mutate({ labelIds: [...currentIds, newLabel.id] });
                                                }
                                              }
                                            }
                                          );
                                        }}
                                        className="inline-flex h-8 px-2 items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium shadow hover:bg-[var(--primary)]/90"
                                      >
                                        Create
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {workspaceLabels
                                    ?.filter((l: any) => !newLabelName || l.name.toLowerCase().includes(newLabelName.toLowerCase()))
                                    .map((l: any) => {
                                      const isSelected = task.labels?.some((lbl: any) => lbl.id === l.id);
                                      return (
                                        <div
                                          key={l.id}
                                          className="px-3 py-1.5 text-sm hover:bg-[var(--muted)] cursor-pointer flex items-center justify-between"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const currentIds = task.labels?.map((lbl: any) => lbl.id) || [];
                                            const newIds = isSelected
                                              ? currentIds.filter((id: string) => id !== l.id)
                                              : [...currentIds, l.id];
                                            updateTask.mutate({ labelIds: newIds });
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: l.color || "#3b82f6" }}
                                            />
                                            {l.name}
                                          </div>
                                          {isSelected && <Check className="w-4 h-4" />}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="grid grid-cols-[100px_1fr] items-center py-1">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Teams
                          </span>
                          <div className="relative">
                            <div
                              className="text-sm font-medium cursor-pointer p-1 -ml-1 rounded hover:bg-[var(--muted)] flex flex-wrap gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTeamsMenuOpen(!teamsMenuOpen);
                              }}
                            >
                              {task.teams?.length > 0
                                ? task.teams.map((t: any) => (
                                  <span
                                    key={t.id}
                                    className="bg-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded text-xs"
                                  >
                                    {t.name}
                                  </span>
                                ))
                                : "Add teams..."}
                            </div>
                            {teamsMenuOpen && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                                {workspaceTeams?.map((t: any) => {
                                  const isSelected = task.teams?.some(
                                    (tm: any) => tm.id === t.id,
                                  );
                                  return (
                                    <div
                                      key={t.id}
                                      className="px-3 py-2 text-sm hover:bg-[var(--muted)] cursor-pointer flex items-center justify-between"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIds =
                                          task.teams?.map((tm: any) => tm.id) ||
                                          [];
                                        const newIds = isSelected
                                          ? currentIds.filter(
                                            (id: string) => id !== t.id,
                                          )
                                          : [...currentIds, t.id];
                                        updateTask.mutate({ teamIds: newIds });
                                      }}
                                    >
                                      {t.name}
                                      {isSelected && (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center py-1">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Reporter
                          </span>
                          <span className="text-sm font-medium">
                            {task.reporter?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Updates Accordion */}
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-white dark:bg-[var(--card)] shadow-sm">
                    <div
                      className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none border-b border-[var(--border)]"
                      onClick={() => setUpdatesExpanded(!updatesExpanded)}
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-[var(--muted-foreground)] transition-transform",
                          !updatesExpanded && "-rotate-90",
                        )}
                      />
                      <span className="font-semibold text-sm">Updates</span>
                    </div>

                    {updatesExpanded && (
                      <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                        {activity?.length === 0 ? (
                          <div className="text-xs text-[var(--muted-foreground)] italic">
                            No updates yet.
                          </div>
                        ) : (
                          activity?.map((log: any) => (
                            <div key={log.id} className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <div className="w-3 h-3 text-red-500">
                                  <div className="flex items-end gap-[1px]">
                                    <div className="w-[2px] h-[3px] bg-current"></div>
                                    <div className="w-[2px] h-[5px] bg-current"></div>
                                    <div className="w-[2px] h-[7px] bg-current"></div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="font-semibold">You</span>{" "}
                                <br />
                                <span className="text-[var(--muted-foreground)]">
                                  {log.action?.replace("_", " ").toLowerCase()}{" "}
                                  {log.createdAt
                                    ? `· ${format(new Date(log.createdAt), "MMM yyyy")}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                        {/* Static mock update for visual parity with Figma */}
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                            <span className="text-[10px] text-white font-bold">
                              U
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">You</span> <br />
                            <span className="text-[var(--muted-foreground)]">
                              posted an update · Aug 2026
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
