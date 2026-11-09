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
import { ACCOUNT_SUSPENDED, ApiError, configureApi } from '../api/client';
import { authApi, isTwoFactorChallenge, type AuthProfile, type AuthSession } from '../api/auth';
import {
  primaryPortal,
  switchablePortals,
  usablePortal as resolveUsablePortal,
  type Portal,
} from '../roles';
import { readPreferredPortal, writePreferredPortal } from '../preferredPortal';
import { writeSelectedClient } from '../agency/selectedClient';
import { forgetPurchaser, identifyPurchaser } from '../purchases';
import { unregisterPush } from '../push';
import { requestAppleCredential } from './apple';
import { accessTokenExpiry, clearTokens, readTokens, writeTokens } from './tokenStore';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from './profileCache';
import { markSessionExpired } from './sessionExpiry';
import { startOAuth } from './oauth';
import { identify, reset as resetAnalytics } from '../analytics';
import { persister } from '../query/client';

interface PendingTwoFactor {
  challengeToken: string;
  /** Absent for Google: its redirect carries only the token. */
  profile?: AuthProfile;
}

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  profile: AuthProfile | null;
  portal: Portal | null;
  usablePortal: Portal | null;
  workspaces: Portal[];
  switchWorkspace: (portal: Portal) => void;
  pendingTwoFactor: PendingTwoFactor | null;
  signIn: (identifier: string, password: string) => Promise<{ requiresTwoFactor: boolean }>;
  completeTwoFactor: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  signInWithMagicLink: (token: string) => Promise<{ requiresTwoFactor: boolean }>;
  /** Throws `OAuthCancelled` if dismissed. */
  signInWithProvider: (provider: 'google') => Promise<{ requiresTwoFactor: boolean }>;
  signInWithApple: () => Promise<{ requiresTwoFactor: boolean }>;
  applyExternalSession: (session: AuthSession) => void;
  refreshProfile: () => Promise<void>;
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
  const [preferredPortal, setPreferredPortal] = useState<Portal | null>(null);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<PendingTwoFactor | null>(null);

  // A ref, so the API client reads the latest token without a re-render and refresh stays single-flight across concurrent 401s.
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
    await clearCachedProfile();
    setPreferredPortal(null);
    await writePreferredPortal(null);
    await writeSelectedClient(null);
    queryClient.clear();
    await persister.removeClient();
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
      } catch (err) {
        markSessionExpired(
          err instanceof ApiError && err.code === ACCOUNT_SUSPENDED
            ? { message: err.message, tone: 'error' }
            : undefined
        );
        await teardown();
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();

    return refreshInFlight.current;
  }, [teardown]);

  useEffect(() => {
    configureApi({
      getAccessToken: () => accessTokenRef.current,
      refresh,
      // Suspension is final for this session: drop it and the cached screens at once rather than leave stale data up.
      onSuspended: async (message) => {
        if (!accessTokenRef.current) return;
        markSessionExpired({ message, tone: 'error' });
        await teardown();
      },
    });
  }, [refresh, teardown]);

  useEffect(() => {
    if (profile?.id) identify(profile.id);
    else resetAnalytics();
  }, [profile?.id]);

  // Driven by the profile, not by each sign-in path, so a new way of getting a session can't forget to cache it.
  useEffect(() => {
    if (profile) void writeCachedProfile(profile);
  }, [profile]);

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
        } else {
          // Offline: trust the stored token and restore the cached profile with it. The portal comes from the roles,
          // so without the profile a guard at a barrier with no signal gets no portal.
          const cached = await readCachedProfile();
          if (!cancelled) {
            setProfile(cached);
            setStatus('authenticated');
          }
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

  const signInWithApple = useCallback(async () => {
    const { identityToken, nonce, fullName } = await requestAppleCredential();
    const result = await authApi.appleSignIn(identityToken, nonce, fullName);
    if (isTwoFactorChallenge(result)) {
      const { requiresTwoFactor: _r, challengeToken, expiresIn: _e, ...prof } = result;
      setPendingTwoFactor({ challengeToken, profile: prof });
      return { requiresTwoFactor: true };
    }
    applySession(result);
    return { requiresTwoFactor: false };
  }, [applySession]);

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
      const result = await authApi.verifyMagicLink(token);
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

  const signInWithProvider = useCallback(async (provider: 'google') => {
    const result = await startOAuth(provider);
    if (result.kind === 'challenge') {
      setPendingTwoFactor({ challengeToken: result.challengeToken });
      return { requiresTwoFactor: true };
    }
    const { accessToken, refreshToken } = result;
    accessTokenRef.current = accessToken;
    refreshTokenRef.current = refreshToken;
    await writeTokens({ accessToken, refreshToken });
    // OAuth returns tokens only, so fetch the profile.
    const prof = await authApi.me();
    setProfile(prof);
    setStatus('authenticated');
    return { requiresTwoFactor: false };
  }, []);

  useEffect(() => {
    void readPreferredPortal().then(setPreferredPortal);
  }, []);

  const userId = profile?.id;
  useEffect(() => {
    if (userId) void identifyPurchaser(userId);
  }, [userId]);

  const switchWorkspace = useCallback((portal: Portal) => {
    setPreferredPortal(portal);
    void writePreferredPortal(portal);
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfile(await authApi.me());
  }, []);

  const signOut = useCallback(async () => {
    // Before the session is cleared: the API only lets a user remove their own device.
    await unregisterPush();
    await forgetPurchaser();
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
      usablePortal: profile ? resolveUsablePortal(profile.roles, preferredPortal) : null,
      workspaces: profile ? switchablePortals(profile.roles) : [],
      switchWorkspace,
      pendingTwoFactor,
      signIn,
      completeTwoFactor,
      cancelTwoFactor: () => setPendingTwoFactor(null),
      signInWithMagicLink,
      signInWithProvider,
      signInWithApple,
      applyExternalSession: applySession,
      refreshProfile,
      signOut,
    }),
    [
      status,
      profile,
      preferredPortal,
      switchWorkspace,
      pendingTwoFactor,
      signIn,
      completeTwoFactor,
      signInWithMagicLink,
      signInWithProvider,
      signInWithApple,
      applySession,
      refreshProfile,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
