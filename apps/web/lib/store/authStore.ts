import { create } from 'zustand';
import { isAuthenticated, logoutSession } from '@sureground/shared';

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
    // Drop the socket first so no events fire after logout; loaded on demand to keep socket.io off public pages.
    try {
      (await import('@/lib/realtime/socket')).disconnectRealtime();
    } catch {
      // A chunk that fails to load means no socket was ever opened from it.
    }
    await logoutSession();
    set({ isAuthenticated: false });
  },
}));
