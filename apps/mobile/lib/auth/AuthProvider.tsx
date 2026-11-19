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
import { useToast } from '@sureground/ui-native';
import { ACCOUNT_SUSPENDED, ApiError, configureApi } from '../api/client';
import { authApi, isTwoFactorChallenge, type AuthProfile, type AuthSession } from '../api/auth';
import {
  primaryPortal,
  switchablePortals,
  usablePortal as resolveUsablePortal,
  type Portal,
  type SignupRoleId,
} from '../roles';
import { readPreferredPortal, writePreferredPortal } from '../preferredPortal';
import { writeSelectedClient } from '../agency/selectedClient';
import { forgetPurchaser, identifyPurchaser } from '../purchases';
import { unregisterPush } from '../push';
import { requestAppleCredential } from './apple';
import { TOKEN_KEYS, accessTokenExpiry, clearTokens, readTokens, writeTokens } from './tokenStore';
import { clearSecureLeftoversOnFreshInstall } from './freshInstall';
import {
  LOCKED_SESSION_KEY,
  UNLOCK_PROMPT,
  canLockWithBiometrics,
  clearLockedSession,
  hasLockedSession,
  lockFailure,
  readLockedRefreshToken,
  storeLockedSession,
  storeUnlockedSession,
} from './lockedSession';
import {
  APP_LOCK_KEY,
  type AppLockChange,
  isAppLockEnabled,
  isAppLocked,
  loadAppLockFlag,
  saveAppLockFlag,
  setAppLocked,
  unlockWithBiometrics,
  waitUntilUnlocked,
} from '../appLock';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from './profileCache';
import { markSessionExpired } from './sessionExpiry';
import { startOAuth } from './oauth';
import { identify, reset as resetAnalytics } from '../analytics';
import { persister } from '../query/client';
import { secureStorage } from '../storage';
import { apiErrorCode } from './signupErrors';
import { gateOfflineQueue } from '../gateOfflineQueue';
import { clearSelectedEstate } from '../../hooks/useEstate';

// Holds the user id while a new social account still has to pick its roles.
const INITIAL_ROLES_KEY = 'sureground.initialRolesPending';

export interface SignInOutcome {
  requiresTwoFactor: boolean;
  /** The provider sign-in just created this account. */
  isNewUser?: boolean;
}

export type UnlockResult = 'unlocked' | 'cancelled' | 'failed' | 'signedOut';

const BIOMETRICS_CHANGED =
  'The fingerprints or face on this phone changed, so sign in again to unlock Sureground.';

// The API sends no profile before the second factor.
interface PendingTwoFactor {
  challengeToken: string;
}

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  profile: AuthProfile | null;
  portal: Portal | null;
  usablePortal: Portal | null;
  workspaces: Portal[];
  switchWorkspace: (portal: Portal) => void;
  pendingTwoFactor: PendingTwoFactor | null;
  signIn: (identifier: string, password: string) => Promise<SignInOutcome>;
  completeTwoFactor: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  signInWithMagicLink: (token: string) => Promise<{ requiresTwoFactor: boolean }>;
  /** Throws `OAuthCancelled` if dismissed. */
  signInWithProvider: (provider: 'google') => Promise<SignInOutcome>;
  signInWithApple: () => Promise<SignInOutcome>;
  applyExternalSession: (session: AuthSession) => Promise<void>;
  /** A social sign-in created the account and its roles are still to be picked. */
  initialRolesPending: boolean;
  /** Resolves `false` when the API no longer takes a first choice; the account keeps the renter role. */
  chooseInitialRoles: (roles: SignupRoleId[]) => Promise<boolean>;
  skipInitialRoles: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Reads the biometric-bound session, so the OS asks for the fingerprint or face. */
  unlock: () => Promise<UnlockResult>;
  setAppLock: (on: boolean) => Promise<AppLockChange>;
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
  const [initialRolesPending, setInitialRolesPending] = useState(false);
  const toast = useToast();

  // A ref, so the API client reads the latest token without a re-render and refresh stays single-flight across concurrent 401s.
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  // A locked launch shows the cached profile until the unlock can fetch a fresh one.
  const profilePending = useRef(false);
  const signingOutLocked = useRef(false);

  // With the lock on, the access token stays in memory and only the refresh token is saved, behind biometrics.
  // A biometric save that fails drops the saved copy: the rotated-away token left behind would read as reuse and end every session.
  const persistTokens = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }): Promise<boolean> => {
      if (isAppLockEnabled()) {
        try {
          await storeLockedSession(tokens.refreshToken);
          return true;
        } catch {
          await clearLockedSession();
          return false;
        }
      }
      try {
        await writeTokens(tokens);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  // The session still works in memory if the keychain refuses it; say so rather than sign them out silently next launch.
  const saveTokens = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      setAppLocked(false);
      if (isAppLockEnabled() && !canLockWithBiometrics()) {
        await saveAppLockFlag(false).catch(() => undefined);
        toast.show(
          'App lock is off because this phone has no fingerprint or face set up.',
          'warning'
        );
      }
      if (!(await persistTokens(tokens))) {
        toast.show(
          'You’re signed in, but this phone couldn’t save your session. You may need to sign in again next time.',
          'error'
        );
      }
    },
    [toast, persistTokens]
  );

  const markInitialRoles = useCallback(async (userId: string | null) => {
    setInitialRolesPending(!!userId);
    if (userId) await secureStorage.set(INITIAL_ROLES_KEY, userId).catch(() => undefined);
    else await secureStorage.remove(INITIAL_ROLES_KEY).catch(() => undefined);
  }, []);

  const applySession = useCallback(
    async (session: AuthSession) => {
      accessTokenRef.current = session.accessToken;
      refreshTokenRef.current = session.refreshToken;
      const { accessToken: _a, refreshToken: _r, expiresIn: _e, isNewUser, ...prof } = session;
      await saveTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
      if (isNewUser) await markInitialRoles(prof.id);
      setProfile(prof);
      setStatus('authenticated');
    },
    [saveTokens, markInitialRoles]
  );

  const teardown = useCallback(async () => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setProfile(null);
    setPendingTwoFactor(null);
    setInitialRolesPending(false);
    setStatus('unauthenticated');
    profilePending.current = false;
    setAppLocked(false);
    await clearTokens();
    await clearLockedSession();
    await secureStorage.remove(INITIAL_ROLES_KEY).catch(() => undefined);
    await clearCachedProfile();
    setPreferredPortal(null);
    await writePreferredPortal(null);
    await writeSelectedClient(null);
    await clearSelectedEstate();
    await gateOfflineQueue.setOwner(null);
    queryClient.clear();
    await persister.removeClient();
  }, [queryClient]);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (signingOutLocked.current) return null;
    if (refreshInFlight.current) return refreshInFlight.current;
    if (!refreshTokenRef.current && !isAppLockEnabled()) return null;

    refreshInFlight.current = (async () => {
      try {
        await waitUntilUnlocked();
        const rt = refreshTokenRef.current;
        if (!rt) return null;
        const res = await authApi.refresh(rt);
        accessTokenRef.current = res.accessToken;
        if (res.refreshToken) refreshTokenRef.current = res.refreshToken;
        await persistTokens({
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
  }, [teardown, persistTokens]);

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
    void gateOfflineQueue.setOwner(profile?.id ?? null);
  }, [profile?.id]);

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
      await clearSecureLeftoversOnFreshInstall([
        ...TOKEN_KEYS,
        LOCKED_SESSION_KEY,
        INITIAL_ROLES_KEY,
        APP_LOCK_KEY,
      ]);
      const lockOn = await loadAppLockFlag();
      const lockedSession = await hasLockedSession();
      if (lockedSession && !lockOn) await clearLockedSession();

      // Nothing is refreshed or fetched before the unlock, so a locked launch never prompts on its own.
      if (lockOn) {
        // A session an older build saved in plain storage is moved behind biometrics at the unlock.
        const legacy = lockedSession ? null : await readTokens();
        if (!lockedSession && !legacy) {
          setAppLocked(false);
          if (!cancelled) setStatus('unauthenticated');
          return;
        }
        refreshTokenRef.current = legacy?.refreshToken ?? null;
        profilePending.current = true;
        const cached = await readCachedProfile();
        if (!cancelled) {
          setProfile(cached);
          setStatus('authenticated');
        }
        return;
      }

      setAppLocked(false);
      const stored = await readTokens();
      if (!stored) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      accessTokenRef.current = stored.accessToken;
      refreshTokenRef.current = stored.refreshToken;

      const exp = stored.accessToken ? accessTokenExpiry(stored.accessToken) : null;
      if (exp === null || exp < Date.now() + 60_000) {
        const fresh = await refresh();
        if (!fresh) return; // teardown already ran
      }

      try {
        const prof = await authApi.me();
        const rolesPendingFor = await secureStorage.get(INITIAL_ROLES_KEY).catch(() => null);
        if (!cancelled) {
          setInitialRolesPending(rolesPendingFor === prof.id);
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
        setPendingTwoFactor({ challengeToken: result.challengeToken });
        return { requiresTwoFactor: true };
      }
      await applySession(result);
      return { requiresTwoFactor: false };
    },
    [applySession]
  );

  const signInWithApple = useCallback(async () => {
    const { identityToken, nonce, fullName } = await requestAppleCredential();
    const result = await authApi.appleSignIn(identityToken, nonce, fullName);
    if (isTwoFactorChallenge(result)) {
      setPendingTwoFactor({ challengeToken: result.challengeToken });
      return { requiresTwoFactor: true };
    }
    await applySession(result);
    return { requiresTwoFactor: false, isNewUser: !!result.isNewUser };
  }, [applySession]);

  const completeTwoFactor = useCallback(
    async (code: string) => {
      if (!pendingTwoFactor) throw new Error('No two-factor challenge in progress');
      const session = await authApi.completeTwoFactor(pendingTwoFactor.challengeToken, code);
      setPendingTwoFactor(null);
      await applySession(session);
    },
    [pendingTwoFactor, applySession]
  );

  const signInWithMagicLink = useCallback(
    async (token: string) => {
      const result = await authApi.verifyMagicLink(token);
      if (isTwoFactorChallenge(result)) {
        setPendingTwoFactor({ challengeToken: result.challengeToken });
        return { requiresTwoFactor: true };
      }
      await applySession(result);
      return { requiresTwoFactor: false };
    },
    [applySession]
  );

  const signInWithProvider = useCallback(
    async (provider: 'google') => {
      const result = await startOAuth(provider);
      if (result.kind === 'challenge') {
        setPendingTwoFactor({ challengeToken: result.challengeToken });
        return { requiresTwoFactor: true };
      }
      const { accessToken, refreshToken, isNewUser } = result;
      accessTokenRef.current = accessToken;
      refreshTokenRef.current = refreshToken;
      await saveTokens({ accessToken, refreshToken });
      // OAuth returns tokens only, so fetch the profile.
      const prof = await authApi.me();
      if (isNewUser) await markInitialRoles(prof.id);
      setProfile(prof);
      setStatus('authenticated');
      return { requiresTwoFactor: false, isNewUser };
    },
    [saveTokens, markInitialRoles]
  );

  const chooseInitialRoles = useCallback(
    async (roles: SignupRoleId[]) => {
      try {
        setProfile(await authApi.setInitialRoles(roles));
        await markInitialRoles(null);
        return true;
      } catch (err) {
        // An older API, or the window has closed: carry on with the renter role they already hold.
        const closed =
          err instanceof ApiError &&
          (err.status === 404 || apiErrorCode(err) === 'INITIAL_ROLES_CLOSED');
        if (!closed) throw err;
        await markInitialRoles(null);
        return false;
      }
    },
    [markInitialRoles]
  );

  const skipInitialRoles = useCallback(() => {
    void markInitialRoles(null);
  }, [markInitialRoles]);

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

  const loadLockedProfile = useCallback(async () => {
    try {
      const prof = await authApi.me();
      const rolesPendingFor = await secureStorage.get(INITIAL_ROLES_KEY).catch(() => null);
      setInitialRolesPending(rolesPendingFor === prof.id);
      setProfile(prof);
    } catch (err) {
      if (err instanceof ApiError && err.isAuth) await teardown();
    }
  }, [teardown]);

  const sessionInvalidated = useCallback(async (): Promise<'signedOut'> => {
    markSessionExpired({ message: BIOMETRICS_CHANGED, tone: 'info' });
    await teardown();
    return 'signedOut';
  }, [teardown]);

  const unlock = useCallback(async (): Promise<UnlockResult> => {
    if (await hasLockedSession()) {
      const read = await readLockedRefreshToken();
      if (read.status === 'gone') return sessionInvalidated();
      if (read.status !== 'ok') return read.status;
      refreshTokenRef.current ??= read.refreshToken;
    } else {
      // Saved by an older build, or a biometric save failed earlier: lock the in-memory session now.
      const rt = refreshTokenRef.current;
      if (!rt) {
        markSessionExpired();
        await teardown();
        return 'signedOut';
      }
      try {
        await storeLockedSession(rt, { prove: true });
      } catch (err) {
        return lockFailure(err);
      }
    }
    setAppLocked(false);
    if (profilePending.current) {
      profilePending.current = false;
      void loadLockedProfile();
    }
    return 'unlocked';
  }, [teardown, sessionInvalidated, loadLockedProfile]);

  const setAppLock = useCallback(
    async (on: boolean): Promise<AppLockChange> => {
      // A rotation still saving under the old setting would leave the token in the wrong place.
      await refreshInFlight.current;
      const accessToken = accessTokenRef.current;
      let refreshToken = refreshTokenRef.current;
      if (on) {
        if (!canLockWithBiometrics()) return 'unavailable';
        if (!refreshToken) return 'failed';
        try {
          await storeLockedSession(refreshToken, { prove: true });
        } catch (err) {
          return lockFailure(err);
        }
        try {
          await saveAppLockFlag(true);
        } catch {
          await storeUnlockedSession({ accessToken, refreshToken }).catch(() => undefined);
          return 'failed';
        }
        setAppLocked(false);
        return 'done';
      }

      if (await hasLockedSession()) {
        const read = await readLockedRefreshToken();
        if (read.status === 'gone') return sessionInvalidated();
        if (read.status !== 'ok') return read.status;
        refreshToken ??= read.refreshToken;
      } else if (!(await unlockWithBiometrics(UNLOCK_PROMPT))) {
        return 'cancelled';
      }
      if (!refreshToken) return 'failed';
      try {
        await storeUnlockedSession({ accessToken, refreshToken });
        await saveAppLockFlag(false);
      } catch {
        return 'failed';
      }
      return 'done';
    },
    [sessionInvalidated]
  );

  const signOut = useCallback(async () => {
    // Behind the lock, a call that needed a refresh would wait for an unlock that never comes.
    signingOutLocked.current = isAppLockEnabled() && isAppLocked();
    try {
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
      // Only a deliberate sign-out drops unsent gate writes; an expired session keeps them for the same guard.
      await gateOfflineQueue.clear();
      await teardown();
    } finally {
      signingOutLocked.current = false;
    }
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
      initialRolesPending,
      chooseInitialRoles,
      skipInitialRoles,
      refreshProfile,
      signOut,
      unlock,
      setAppLock,
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
      initialRolesPending,
      chooseInitialRoles,
      skipInitialRoles,
      refreshProfile,
      signOut,
      unlock,
      setAppLock,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
