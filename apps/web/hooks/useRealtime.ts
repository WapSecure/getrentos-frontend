'use client';

import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { currentAccessToken } from '@/lib/apiClient';
import { getRealtimeSocket } from '@/lib/realtime/socket';

/**
 * Subscribes the given handler to a real-time event for the lifetime of the
 * component. The socket is (re)connected on mount; the subscription is removed
 * on unmount. Safe to use in any authenticated client component.
 */
export function useRealtimeEvent(event: string, handler: (payload: unknown) => void): void {
  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;
    // The access token is in memory only, so straight after a page load it may
    // still be on its way back from the refresh cookie: wait for it.
    void currentAccessToken().then(() => {
      if (cancelled) return;
      socket = getRealtimeSocket();
      socket?.on(event, handler);
    });
    return () => {
      cancelled = true;
      socket?.off(event, handler);
    };
  }, [event, handler]);
}
