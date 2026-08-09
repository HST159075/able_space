'use client';

import { useParams } from 'next/navigation';
import { useTeam } from '@/lib/api';
import { Users, Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeamDetailsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const teamId = params.teamId as string;

  const { data: team, isLoading } = useTeam(workspaceId, teamId);

  if (isLoading) {
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
        <Button className="gap-2 shadow-sm rounded-lg">
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
              <li key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--muted)]/20 transition-colors">
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
    </div>
  );
}
