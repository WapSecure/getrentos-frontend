'use client';

import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from '@/lib/apiHelpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;
let tokenAtConnect: string | null = null;

export function getRealtimeSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  if (!token) return null;

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

export function disconnectRealtime(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    tokenAtConnect = null;
  }
}
