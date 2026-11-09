'use client';

import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { currentAccessToken } from '@/lib/apiClient';
import { getRealtimeSocket } from '@/lib/realtime/socket';

export function useRealtimeEvent(event: string, handler: (payload: unknown) => void): void {
  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;
    // The access token may still be coming back from the refresh cookie after a page load: wait for it.
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
