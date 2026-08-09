import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

// --- Workspaces ---
export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data.data;
    },
  });
};

export const useWorkspace = (workspaceId: string) => {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}`);
      return res.data.data;
    },
    enabled: !!workspaceId,
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/workspaces', { name });
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
};

// --- Teams ---
export const useTeams = (workspaceId: string) => {
  return useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/teams`);
      return res.data.data;
    },
    enabled: !!workspaceId,
  });
};

export const useTeam = (workspaceId: string, teamId: string) => {
  return useQuery({
    queryKey: ['team', workspaceId, teamId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/teams`);
      const teams = res.data.data;
      return teams.find((t: any) => t.id === teamId);
    },
    enabled: !!workspaceId && !!teamId,
  });
};

export const useCreateTeam = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post(`/workspaces/${workspaceId}/teams`, { name });
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] }),
  });
};

// --- Projects ---
export const useProjects = (workspaceId: string) => {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/projects`);
      return res.data.data;
    },
    enabled: !!workspaceId,
  });
};

export const useCreateProject = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; priority?: string; dueDate?: string }) => {
      const res = await api.post(`/workspaces/${workspaceId}/projects`, payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] }),
  });
};

// --- Labels ---
export const useLabels = (workspaceId: string) => {
  return useQuery({
    queryKey: ['labels', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/labels`);
      return res.data.data;
    },
    enabled: !!workspaceId,
  });
};

// --- Tasks ---
export const useTasks = (projectId: string) => {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/tasks`);
      return res.data.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
      labelIds?: string[];
    }) => {
      const res = await api.post(`/projects/${projectId}/tasks`, payload);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
};

export const useUpdateTask = (projectId: string, taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/projects/${projectId}/tasks/${taskId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', taskId] });
    },
  });
};

export const useUpdateTaskStatus = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status, position }: { taskId: string; status: string; position?: number }) => {
      const payload: any = { status };
      if (position !== undefined) payload.position = position;
      const res = await api.patch(`/projects/${projectId}/tasks/${taskId}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
};

export const useDeleteTask = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });
};
