'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ensureValidSession,
  logoutSession,
  markSessionExpired,
  ROUTES,
  refreshSession,
} from '@sureground/shared';

// The warning opens DEFAULT_WARNING_MS before this, not after it.
const DEFAULT_IDLE_MS = 30 * 60 * 1000;
const DEFAULT_WARNING_MS = 2 * 60 * 1000;

// Refresh only after recent activity: an idle tab that refreshed itself would never reach the idle logout on a shared device.
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 30 * 1000;

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'keydown',
  'scroll',
  'mousemove',
  'touchstart',
];

export interface SessionActivityControls {
  secondsLeft: number | null;
  isExtending: boolean;
  continueSession: () => void;
  signOut: () => void;
}

export function useSessionActivity(
  idleMs: number = DEFAULT_IDLE_MS,
  warningMs: number = DEFAULT_WARNING_MS,
  redirectTo: string = ROUTES.LOGIN
): SessionActivityControls {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isExtending, setIsExtending] = useState(false);

  const idleMsRef = useRef(idleMs);
  const warningMsRef = useRef(warningMs);
  const redirectToRef = useRef(redirectTo);

  useEffect(() => {
    idleMsRef.current = idleMs;
    warningMsRef.current = warningMs;
    redirectToRef.current = redirectTo;
  });

  const lastActivityRef = useRef(0);
  const warnedRef = useRef(false);
  const endedRef = useRef(false);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) {
      clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  const endSession = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    clearTimers();
    setSecondsLeft(0);
    markSessionExpired();
    void logoutSession().finally(() => {
      window.location.href = redirectToRef.current;
    });
  }, [clearTimers]);

  const armTimers = useCallback(() => {
    clearTimers();
    warnedRef.current = false;
    const warnAfter = Math.max(idleMsRef.current - warningMsRef.current, 0);
    warnTimerRef.current = setTimeout(() => {
      warnedRef.current = true;
      setSecondsLeft(Math.max(Math.ceil(warningMsRef.current / 1000), 1));
      endTimerRef.current = setTimeout(endSession, warningMsRef.current);
    }, warnAfter);
  }, [clearTimers, endSession]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    lastActivityRef.current = Date.now();

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      // Once the warning shows, only an explicit answer may extend the session.
      if (warnedRef.current) return;
      armTimers();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );
    armTimers();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      clearTimers();
    };
  }, [armTimers, clearTimers]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const timeout = setTimeout(
      () => setSecondsLeft((current) => (current ? current - 1 : current)),
      1000
    );
    return () => clearTimeout(timeout);
  }, [secondsLeft]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const heartbeat = setInterval(() => {
      if (warnedRef.current || endedRef.current) return;
      if (Date.now() - lastActivityRef.current > ACTIVE_WINDOW_MS) return;
      void ensureValidSession();
    }, HEARTBEAT_MS);
    return () => clearInterval(heartbeat);
  }, []);

  const continueSession = useCallback(() => {
    // Force a rotation: only rotating extends the server-side session and its refresh cookie.
    setIsExtending(true);
    void refreshSession().then((extended) => {
      setIsExtending(false);
      // A refused refresh already fired the expired redirect; an unreachable API keeps the prompt.
      if (!extended) return;
      lastActivityRef.current = Date.now();
      setSecondsLeft(null);
      armTimers();
    });
  }, [armTimers]);

  return { secondsLeft, isExtending, continueSession, signOut: endSession };
}
