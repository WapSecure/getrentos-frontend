'use client';

import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from '@/lib/apiHelpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;
let tokenAtConnect: string | null = null;

/**
 * Returns the shared real-time socket for the current session, connecting with
 * the access token when one is available. Reuses the existing connection.
 */
export function getRealtimeSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  if (!token) return null;

  // A new token (session refresh) means we must reconnect with it.
  if (socket && tokenAtConnect && token !== tokenAtConnect) {
    socket.disconnect();
    socket = null;
  }

  if (!socket || !socket.connected) {
    tokenAtConnect = token;
    socket = io(`${API_BASE_URL}/realtime`, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
  }

  return socket;
}

/** Disconnects and drops the shared socket (used on sign-out). */
export function disconnectRealtime(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    tokenAtConnect = null;
  }
}
