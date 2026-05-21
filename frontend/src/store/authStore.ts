import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';

interface User {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  github_id: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: async (token) => {
        set({ token, isAuthenticated: true });
        await get().fetchMe();
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        authApi.logout().catch(() => {}); // Fire and forget
      },
      fetchMe: async () => {
        try {
          const response = await authApi.getMe();
          set({ user: response.data });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
