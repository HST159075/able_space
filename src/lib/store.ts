import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  themeMode: 'LIGHT' | 'DARK' | 'SYSTEM';
  accentColor: 'BLUE' | 'AMBER' | 'PINK' | 'ROSE' | 'EMERALD' | 'BLACK';
}

interface AppState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  
  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      logout: () => set({ token: null, user: null }),
      
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ablespace-storage',
    }
  )
);
