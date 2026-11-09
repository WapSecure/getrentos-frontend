'use client';

import { useEffect, useState } from 'react';

export function SessionExpiredNotice() {
  const [expired, setExpired] = useState(false);

  // Not useSearchParams(), which would force these pages into a Suspense boundary.
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
