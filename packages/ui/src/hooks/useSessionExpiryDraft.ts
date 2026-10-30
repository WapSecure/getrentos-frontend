'use client';

import { useEffect, useRef, useState } from 'react';
import { onSessionExpired } from '@getrentos/shared';

const PREFIX = 'gr_draft:';

/** True when a form left a draft behind as the session ended (e.g. to reopen its dialog). */
export function hasSessionDraft(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(PREFIX + key) !== null;
  } catch {
    return false;
  }
}

/** Drops a saved draft, e.g. once the form it belonged to was submitted. */
export function clearSessionDraft(key: string): void {
  try {
    window.sessionStorage.removeItem(PREFIX + key);
  } catch {
    // storage unavailable: nothing was saved either
  }
}

/**
 * Keeps what someone typed when their session runs out mid-form. The moment
 * the app gives up on the session (just before it sends them to sign in), the
 * form's current values are written to this tab's sessionStorage; when the form
 * mounts again after sign-in they are handed back once and removed.
 *
 * `snapshot` returns the values worth keeping, or null when there is nothing.
 * `restore` puts them back. Returns true while a restored draft is showing, so
 * the form can say so.
 */
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
