'use client';

import { io, type Socket } from 'socket.io-client';
import {
  attachRealtimeSessionRecovery,
  clearAuthSession,
  getAuthToken,
  hasStoredSession,
  markSessionExpired,
  refreshSession,
} from '@/lib/apiHelpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// One socket for the tab: hooks add their listeners to it, so it is reconnected in place, never replaced.
let socket: Socket | null = null;
let detachRecovery: (() => void) | null = null;

function signOutFromRealtime() {
  disconnectRealtime();
  // A refused refresh has already cleared the session and told the app.
  if (hasStoredSession() || getAuthToken()) {
    clearAuthSession();
    markSessionExpired();
  }
}

export function getRealtimeSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  if (!token) return null;

  if (!socket) {
    socket = io(`${API_BASE_URL}/realtime`, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    detachRecovery = attachRealtimeSessionRecovery(socket, {
      refresh: refreshSession,
      getToken: getAuthToken,
      onSignedOut: signOutFromRealtime,
    });
    return socket;
  }

  const connectedWith = (socket.auth as { token?: string } | undefined)?.token;
  if (connectedWith !== token) {
    socket.auth = { token };
    socket.disconnect().connect();
  } else if (!socket.active) {
    socket.connect();
  }

  return socket;
}

export function disconnectRealtime(): void {
  detachRecovery?.();
  detachRecovery = null;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
