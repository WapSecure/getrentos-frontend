import { create } from 'zustand';
import { isAuthenticated, logoutSession } from '@sureground/shared';
import { disconnectRealtime } from '@/lib/realtime/socket';

interface AuthState {
  isAuthenticated: boolean;
  init: () => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  init: () => set({ isAuthenticated: isAuthenticated() }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  logout: async () => {
    // Drop the realtime socket first so no events fire after logout.
    disconnectRealtime();
    await logoutSession();
    set({ isAuthenticated: false });
  },
}));
