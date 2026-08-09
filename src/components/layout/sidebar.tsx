'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useWorkspaces, useTeams, useProjects } from '@/lib/api';
import { useStore } from '@/lib/store';
import { FolderDot, Users, Briefcase, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { CreateWorkspaceModal, CreateTeamModal, CreateProjectModal } from '@/components/create-modals';
import { UserPopover } from '@/components/layout/user-popover';

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;

  const { data: workspaces } = useWorkspaces();
  const { data: teams } = useTeams(workspaceId);
  const { data: projects } = useProjects(workspaceId);
  const sidebarOpen = useStore((state) => state.sidebarOpen);

  const [wsModal, setWsModal] = useState(false);
  const [teamModal, setTeamModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);

  // Collapse state
  const [wsExpanded, setWsExpanded] = useState(true);
  const [teamExpanded, setTeamExpanded] = useState(true);
  const [projectExpanded, setProjectExpanded] = useState(true);

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="relative h-full bg-[var(--card)] border-r border-[var(--border)] flex flex-col shrink-0"
          >
            {/* User Popover at the top */}
            <div className="px-2 pt-2 pb-1 border-b border-[var(--border)]">
              <UserPopover />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-6">
              {/* Workspaces */}
              <div>
                <div
                  onClick={() => setWsExpanded(!wsExpanded)}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 px-2 flex items-center justify-between group cursor-pointer hover:text-[var(--foreground)] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !wsExpanded && "-rotate-90")} />
                    Workspaces
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setWsModal(true); }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-[var(--muted)] p-1 rounded transition-all hover:text-[var(--primary)] text-[var(--muted-foreground)]"
                    title="New Workspace"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <AnimatePresence>
                  {wsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {workspaces?.map((ws: any) => (
                        <Link
                          key={ws.id}
                          href={`/${ws.id}/projects`}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ml-4',
                            workspaceId === ws.id
                              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                              : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                          )}
                        >
                          <Briefcase className="w-4 h-4 shrink-0" />
                          <span className="truncate">{ws.name}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {workspaceId && (
                <>
                  {/* Teams */}
                  <div>
                    <div
                      onClick={() => setTeamExpanded(!teamExpanded)}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 px-2 flex items-center justify-between group cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !teamExpanded && "-rotate-90")} />
                        Teams
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setTeamModal(true); }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-[var(--muted)] p-1 rounded transition-all hover:text-[var(--primary)] text-[var(--muted-foreground)]"
                        title="New Team"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <AnimatePresence>
                      {teamExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1 overflow-hidden"
                        >
                          {teams?.map((team: any) => {
                            const isActive = pathname.includes(`/teams/${team.id}`);
                            return (
                              <Link
                                key={team.id}
                                href={`/${workspaceId}/teams/${team.id}`}
                                className={cn(
                                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ml-4',
                                  isActive
                                    ? 'bg-[var(--muted)] text-[var(--primary)] font-medium'
                                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                                )}
                              >
                                <Users className={cn('w-4 h-4 shrink-0', isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]')} />
                                <span className="truncate">{team.name}</span>
                              </Link>
                            );
                          })}
                          {teams?.length === 0 && (
                            <p className="text-xs text-[var(--muted-foreground)] px-2 py-1 italic ml-4">No teams yet</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Projects */}
                  <div>
                    <div
                      onClick={() => setProjectExpanded(!projectExpanded)}
                      className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 px-2 flex items-center justify-between group cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !projectExpanded && "-rotate-90")} />
                        Projects
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setProjectModal(true); }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-[var(--muted)] p-1 rounded transition-all hover:text-[var(--primary)] text-[var(--muted-foreground)]"
                        title="New Project"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <AnimatePresence>
                      {projectExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1 overflow-hidden"
                        >
                          {projects?.map((project: any) => {
                            const isActive = pathname.includes(`/projects/${project.id}`);
                            return (
                              <Link
                                key={project.id}
                                href={`/${workspaceId}/projects/${project.id}/board`}
                                className={cn(
                                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ml-4',
                                  isActive
                                    ? 'bg-[var(--muted)] text-[var(--primary)] font-medium'
                                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                                )}
                              >
                                <FolderDot className={cn('w-4 h-4 shrink-0', isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]')} />
                                <span className="truncate">{project.name}</span>
                              </Link>
                            );
                          })}
                          {projects?.length === 0 && (
                            <p className="text-xs text-[var(--muted-foreground)] px-2 py-1 italic ml-4">No projects yet</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CreateWorkspaceModal open={wsModal} onClose={() => setWsModal(false)} />
      <CreateTeamModal open={teamModal} onClose={() => setTeamModal(false)} />
      <CreateProjectModal open={projectModal} onClose={() => setProjectModal(false)} />
    </>
  );
}
