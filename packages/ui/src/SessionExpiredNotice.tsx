'use client';

import { useEffect, useState } from 'react';

/**
 * Shown on a sign-in screen when the user landed here because their session
 * could not be refreshed (see `onSessionExpired` in @getrentos/shared), so
 * "why am I back at the login page?" has an answer instead of looking like a
 * random logout.
 */
export function SessionExpiredNotice() {
  const [expired, setExpired] = useState(false);

  // Read from the URL in an effect rather than useSearchParams(), which would
  // force these pages to opt into a Suspense boundary.
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    setExpired(reason === 'session_expired');
  }, []);

  if (!expired) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
    >
      Your session expired, so we signed you out to keep your account secure. Please sign in again.
    </div>
  );
}
