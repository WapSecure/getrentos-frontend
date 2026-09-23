'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ensureValidSession,
  logoutSession,
  markSessionExpired,
  ROUTES,
  refreshSession,
} from '@getrentos/shared';

/** Inactivity that opens the warning dialog: 30 minutes. */
const DEFAULT_IDLE_MS = 30 * 60 * 1000;
/** How long the user gets to answer the dialog before the session is dropped. */
const DEFAULT_WARNING_MS = 2 * 60 * 1000;

/**
 * While the user is demonstrably at the keyboard we rotate the access token in
 * the background, so a long-but-active session never dies mid-task. It only
 * runs while there has been activity inside this window — a genuinely idle tab
 * must never refresh itself, or the idle logout could never fire on a shared
 * device.
 */
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
  /** Whole seconds left to answer the dialog, or null when it is not showing. */
  secondsLeft: number | null;
  /** True while the "still here?" refresh is in flight. */
  isExtending: boolean;
  /** Rotates the refresh token and restarts the idle countdown. */
  continueSession: () => void;
  /** Ends the session immediately. */
  signOut: () => void;
}

/**
 * Tracks user activity for a signed-in area and turns the old silent logout
 * into a conversation: at `idleMs - warningMs` the caller is told to show a
 * "still here?" dialog, and only if that goes unanswered does the session
 * actually end. Answering it rotates the refresh token, which really does
 * extend the session server-side rather than just resetting a client timer.
 *
 * Activity events are ignored once the dialog is up — otherwise a stray mouse
 * movement would make the warning disappear unread.
 */
export function useSessionActivity(
  idleMs: number = DEFAULT_IDLE_MS,
  warningMs: number = DEFAULT_WARNING_MS,
  redirectTo: string = ROUTES.LOGIN
): SessionActivityControls {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isExtending, setIsExtending] = useState(false);

  // Refs mirror the props so the timers and handlers below can stay stable
  // without re-subscribing every render when a prop changes. They are synced in
  // an effect (never during render) to satisfy the render-purity rules.
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
    // Same contract as before: flag the reason so the sign-in screen can
    // explain itself, revoke server-side, then leave the protected area.
    markSessionExpired();
    void logoutSession().finally(() => {
      window.location.href = redirectToRef.current;
    });
  }, [clearTimers]);

  /** Arms the warning timer. Only touches timers/refs — no state here, so the
   *  effect that calls it on mount stays a pure external-system subscription. */
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
      // Once the dialog is up only an explicit answer may extend the session.
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

  // Countdown shown inside the dialog.
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const timeout = setTimeout(
      () => setSecondsLeft((current) => (current ? current - 1 : current)),
      1000
    );
    return () => clearTimeout(timeout);
  }, [secondsLeft]);

  // Keep an *active* session alive. `ensureValidSession` only reaches the
  // network when the access token is genuinely close to expiry, so this is a
  // no-op most of the time.
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
    // Force a rotation rather than an `ensureValidSession()` no-op: rotating is
    // what actually pushes the server-side session (and its refresh cookie)
    // further into the future.
    setIsExtending(true);
    void refreshSession().then((extended) => {
      setIsExtending(false);
      // On failure refreshSession() has already cleared the session and fired
      // the expired listeners, so the redirect is already under way.
      if (!extended) return;
      lastActivityRef.current = Date.now();
      setSecondsLeft(null);
      armTimers();
    });
  }, [armTimers]);

  return { secondsLeft, isExtending, continueSession, signOut: endSession };
}
