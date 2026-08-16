'use client';

import { useEffect } from 'react';
import { getRealtimeSocket } from '@/lib/realtime/socket';

/**
 * Subscribes the given handler to a real-time event for the lifetime of the
 * component. The socket is (re)connected on mount; the subscription is removed
 * on unmount. Safe to use in any authenticated client component.
 */
export function useRealtimeEvent(event: string, handler: (payload: unknown) => void): void {
  useEffect(() => {
    const socket = getRealtimeSocket();
    if (!socket) return;

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}
