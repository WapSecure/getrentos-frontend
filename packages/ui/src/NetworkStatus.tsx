'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const isOnline = useSyncExternalStore(
    (onStatusChange) => {
      window.addEventListener('online', onStatusChange);
      window.addEventListener('offline', onStatusChange);
      return () => {
        window.removeEventListener('online', onStatusChange);
        window.removeEventListener('offline', onStatusChange);
      };
    },
    () => navigator.onLine,
    () => true
  );

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-center text-sm font-medium text-background shadow-xl"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You are offline. Some actions are unavailable.
    </div>
  );
}
