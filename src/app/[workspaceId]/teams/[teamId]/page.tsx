'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTeam, useWorkspace, useAddTeamMember, useRemoveTeamMember } from '@/lib/api';
import { Users, Mail, UserPlus, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TeamDetailsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const teamId = params.teamId as string;

  const { data: team, isLoading: teamLoading } = useTeam(workspaceId, teamId);
  const { data: workspace } = useWorkspace(workspaceId);
  const addMember = useAddTeamMember(workspaceId, teamId);
  const removeMember = useRemoveTeamMember(workspaceId, teamId);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleAddMember = async (userId: string) => {
    try {
      await addMember.mutateAsync(userId);
      toast.success('Member added to team');
      setAddModalOpen(false);
    } catch {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember.mutateAsync(userId);
      toast.success('Member removed from team');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  if (teamLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-[var(--muted-foreground)]">
        <Users className="w-12 h-12 mb-4 opacity-50" />
        <p>Team not found.</p>
      </div>
    );
  }

  // Find users in workspace who are not in the team
  const availableUsers = workspace?.members?.filter(
    (wUser: any) => !team.members?.some((tUser: any) => tUser.id === wUser.id)
  ) || [];

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            {team.name}
          </h1>
          <p className="text-[var(--muted-foreground)]">Manage team members and view who is part of this team.</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2 shadow-sm rounded-lg">
          <UserPlus className="w-4 h-4" /> Add Member
        </Button>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            Team Members ({team.members?.length || 0})
          </h3>
        </div>
        
        {team.members?.length > 0 ? (
          <ul className="divide-y divide-[var(--border)]">
            {team.members.map((member: any) => (
              <li key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--muted)]/20 transition-colors group">
                <div className="flex items-center gap-4">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full border border-[var(--border)] object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {member.name?.charAt(0) || member.username?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[15px] text-[var(--foreground)]">
                      {member.name || member.username}
                      {member.isGuest && <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 px-1.5 py-0.5 rounded">Guest</span>}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email || 'No email provided'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={removeMember.isPending}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Remove from team"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center text-[var(--muted-foreground)] flex flex-col items-center">
            <Users className="w-10 h-10 mb-3 opacity-20" />
            <p>No members in this team yet.</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--card)] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold">Add Team Member</h2>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1.5 hover:bg-[var(--muted)] rounded-lg text-[var(--muted-foreground)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {availableUsers.length > 0 ? (
                  <div className="space-y-2">
                    {availableUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-[var(--border)] object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm text-[var(--foreground)]">{user.name || user.username}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{user.email || 'No email'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(user.id)}
                          disabled={addMember.isPending}
                          className="h-8 gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <p>All workspace members are already in this team.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
