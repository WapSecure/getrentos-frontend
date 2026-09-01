import { create } from 'zustand';
import { getAuthToken, logoutSession } from '@getrentos/shared';
import { disconnectRealtime } from '@/lib/realtime/socket';

/**
 * Reactive auth state. Components that need to react to sign-in/sign-out
 * (e.g. the marketing Navigation) subscribe to `isAuthenticated` instead of
 * reading storage ad hoc — which also removes the need for a hard reload on
 * logout. `getAuthToken`/storage remain the single source of truth; this
 * store mirrors that truth into React state.
 */
interface AuthState {
  isAuthenticated: boolean;
  /** Syncs the store from storage. Call once at app bootstrap. */
  init: () => void;
  /** Mark the user signed in (e.g. after login / session refresh). */
  setAuthenticated: (value: boolean) => void;
  /** Signs out everywhere and updates reactive state. */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  init: () => set({ isAuthenticated: Boolean(getAuthToken()) }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  logout: async () => {
    // Drop the realtime socket first so no further events fire post-logout.
    disconnectRealtime();
    await logoutSession();
    set({ isAuthenticated: false });
  },
}));
