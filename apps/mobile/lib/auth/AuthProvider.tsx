import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, configureApi } from '../api/client';
import { authApi, isTwoFactorChallenge, type AuthProfile, type AuthSession } from '../api/auth';
import { primaryPortal, type Portal } from '../roles';
import { accessTokenExpiry, clearTokens, readTokens, writeTokens } from './tokenStore';

interface PendingTwoFactor {
  challengeToken: string;
  profile: AuthProfile;
}

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  profile: AuthProfile | null;
  portal: Portal | null;
  pendingTwoFactor: PendingTwoFactor | null;
  signIn: (identifier: string, password: string) => Promise<{ requiresTwoFactor: boolean }>;
  completeTwoFactor: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  signInWithMagicLink: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<PendingTwoFactor | null>(null);

  // Access token in a ref so the API client reads the latest value without a
  // re-render, and refresh stays single-flight across concurrent 401s.
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const applySession = useCallback((session: AuthSession) => {
    accessTokenRef.current = session.accessToken;
    refreshTokenRef.current = session.refreshToken;
    const { accessToken: _a, refreshToken: _r, expiresIn: _e, ...prof } = session;
    setProfile(prof);
    setStatus('authenticated');
    void writeTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
  }, []);

  const teardown = useCallback(async () => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setProfile(null);
    setPendingTwoFactor(null);
    setStatus('unauthenticated');
    await clearTokens();
    queryClient.clear();
  }, [queryClient]);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const rt = refreshTokenRef.current;
    if (!rt) return null;

    refreshInFlight.current = (async () => {
      try {
        const res = await authApi.refresh(rt);
        accessTokenRef.current = res.accessToken;
        if (res.refreshToken) refreshTokenRef.current = res.refreshToken;
        await writeTokens({
          accessToken: res.accessToken,
          refreshToken: refreshTokenRef.current!,
        });
        return res.accessToken;
      } catch {
        await teardown();
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
  }, [teardown]);

  // Wire the transport once.
  useEffect(() => {
    configureApi({ getAccessToken: () => accessTokenRef.current, refresh });
  }, [refresh]);

  // Restore the session on cold start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readTokens();
      if (!stored) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      accessTokenRef.current = stored.accessToken;
      refreshTokenRef.current = stored.refreshToken;

      const exp = accessTokenExpiry(stored.accessToken);
      if (exp === null || exp < Date.now() + 60_000) {
        const fresh = await refresh();
        if (!fresh) return; // teardown already ran
      }

      try {
        const prof = await authApi.me();
        if (!cancelled) {
          setProfile(prof);
          setStatus('authenticated');
        }
      } catch (err) {
        if (err instanceof ApiError && err.isAuth) {
          await teardown();
        } else if (!cancelled) {
          // Offline / server down: trust the stored token so the app still opens.
          setStatus('authenticated');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, teardown]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const result = await authApi.login(identifier.trim(), password);
      if (isTwoFactorChallenge(result)) {
        const { requiresTwoFactor: _r, challengeToken, expiresIn: _e, ...prof } = result;
        setPendingTwoFactor({ challengeToken, profile: prof });
        return { requiresTwoFactor: true };
      }
      applySession(result);
      return { requiresTwoFactor: false };
    },
    [applySession]
  );

  const completeTwoFactor = useCallback(
    async (code: string) => {
      if (!pendingTwoFactor) throw new Error('No two-factor challenge in progress');
      const session = await authApi.completeTwoFactor(pendingTwoFactor.challengeToken, code);
      setPendingTwoFactor(null);
      applySession(session);
    },
    [pendingTwoFactor, applySession]
  );

  const signInWithMagicLink = useCallback(
    async (token: string) => {
      const session = await authApi.verifyMagicLink(token);
      applySession(session);
    },
    [applySession]
  );

  const signOut = useCallback(async () => {
    const rt = refreshTokenRef.current;
    if (rt) {
      try {
        await authApi.logout(rt);
      } catch {
        // best effort — clear locally regardless
      }
    }
    await teardown();
  }, [teardown]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      profile,
      portal: profile ? primaryPortal(profile.roles) : null,
      pendingTwoFactor,
      signIn,
      completeTwoFactor,
      cancelTwoFactor: () => setPendingTwoFactor(null),
      signInWithMagicLink,
      signOut,
    }),
    [status, profile, pendingTwoFactor, signIn, completeTwoFactor, signInWithMagicLink, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
