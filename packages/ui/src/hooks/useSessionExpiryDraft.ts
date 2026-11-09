'use client';

import { useEffect, useRef, useState } from 'react';
import { onSessionExpired } from '@sureground/shared';

const PREFIX = 'gr_draft:';

export function hasSessionDraft(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(PREFIX + key) !== null;
  } catch {
    return false;
  }
}

export function clearSessionDraft(key: string): void {
  try {
    window.sessionStorage.removeItem(PREFIX + key);
  } catch {
    // storage unavailable: nothing was saved either
  }
}

export function useSessionExpiryDraft<T>(
  key: string,
  snapshot: () => T | null,
  restore: (draft: T) => void,
  enabled = true
): boolean {
  const snapshotRef = useRef(snapshot);
  const restoreRef = useRef(restore);
  useEffect(() => {
    snapshotRef.current = snapshot;
    restoreRef.current = restore;
  });

  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = window.sessionStorage.getItem(PREFIX + key);
      if (raw !== null) {
        window.sessionStorage.removeItem(PREFIX + key);
        restoreRef.current(JSON.parse(raw) as T);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRestored(true);
      }
    } catch {
      // unreadable draft: start clean
    }
    return onSessionExpired(() => {
      const values = snapshotRef.current();
      if (values === null) return;
      try {
        window.sessionStorage.setItem(PREFIX + key, JSON.stringify(values));
      } catch {
        // storage full or blocked: the redirect still happens
      }
    });
  }, [key, enabled]);

  return restored;
}
