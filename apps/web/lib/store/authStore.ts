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
    // Drop the realtime socket first so no events fire after logout. Loaded on demand so
    // socket.io stays out of the public pages that only read the signed-in flag.
    try {
      (await import('@/lib/realtime/socket')).disconnectRealtime();
    } catch {
      // A chunk that fails to load means no socket was ever opened from it.
    }
    await logoutSession();
    set({ isAuthenticated: false });
  },
}));
