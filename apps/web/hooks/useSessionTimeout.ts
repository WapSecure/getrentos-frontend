'use client';

import { useEffect, useRef } from 'react';
import { logoutSession, markSessionExpired } from '@/lib/apiClient';
import { ROUTES } from '@/lib/constants/auth';

const DEFAULT_IDLE_MS = 30 * 60 * 1000; // 30 minutes of inactivity

/**
 * Automatically signs the user out after a period of inactivity (best practice
 * for protecting sessions on shared devices). Activity = pointer, keyboard,
 * scroll, or touch. On idle: revokes the session server-side, marks it expired
 * so the login screen explains what happened, and redirects to /login.
 */
export function useSessionTimeout(idleMs: number = DEFAULT_IDLE_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signedOutRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (signedOutRef.current) return;
        signedOutRef.current = true;
        markSessionExpired();
        void logoutSession().finally(() => {
          window.location.href = ROUTES.LOGIN;
        });
      }, idleMs);
    };

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'mousemove',
      'touchstart',
    ];
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((event) => window.removeEventListener(event, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [idleMs]);

  return null;
}
