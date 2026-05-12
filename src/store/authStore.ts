import { create } from 'zustand';
import type { User } from '../api/types';
import { fetchMe } from '../api/auth';
import { getToken, setToken } from '../api/client';

interface AuthState {
  hydrated: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  hydrated: false,
  token: null,
  user: null,
  loading: false,

  hydrate: async () => {
    const token = await getToken();
    if (!token) {
      set({ hydrated: true });
      return;
    }
    set({ token, loading: true });
    try {
      const user = await fetchMe();
      set({ user, hydrated: true, loading: false });
    } catch {
      await setToken(null);
      set({ token: null, user: null, hydrated: true, loading: false });
    }
  },

  setSession: async (token, user) => {
    await setToken(token);
    set({ token, user });
  },

  refreshMe: async () => {
    if (!get().token) return;
    try {
      const user = await fetchMe();
      set({ user });
    } catch {
      // ignore
    }
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await setToken(null);
    set({ token: null, user: null });
  },
}));
