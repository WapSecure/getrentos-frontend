import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, ApiError, clearToken, getToken, setToken } from './api';

export interface AuthUser {
  id?: string;
  fullName: string;
  email: string;
  /** Primary role id, e.g. 'renter' | 'landlord' | 'owner' | ... */
  role: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

/**
 * Restores the session on launch (token in secure store → fetch the profile),
 * and exposes sign-in / sign-out. This is the foundation the full role
 * dashboards will build on; wire the same endpoints the web app uses.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setUser(null);
          return;
        }
        try {
          const me = await apiFetch<AuthUser>('/auth/me');
          setUser(me);
        } catch (err) {
          // Session no longer valid — clear the stored token.
          if (err instanceof ApiError && err.status === 401) {
            await clearToken();
          }
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const result = await apiFetch<{ accessToken: string } & Partial<AuthUser>>('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
    await setToken(result.accessToken);
    // Derive a minimal profile from the login payload; /auth/me refines it.
    setUser({
      fullName: result.fullName ?? result.email ?? identifier,
      email: result.email ?? identifier,
      role: result.role ?? result.roles?.[0] ?? 'renter',
      roles: result.roles ?? [result.role ?? 'renter'],
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Server may be unreachable — still clear the local session.
    }
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
