// Codes the API's realtime gateway sends in a `connection_error` event just before it disconnects.
export const REALTIME_TOKEN_EXPIRED = 'TOKEN_EXPIRED';
export const REALTIME_SESSION_ENDED = 'SESSION_ENDED';
export const REALTIME_AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED';

export type RealtimeAuthCode =
  | typeof REALTIME_TOKEN_EXPIRED
  | typeof REALTIME_SESSION_ENDED
  | typeof REALTIME_AUTHENTICATION_REQUIRED;

const AUTH_CODES: readonly string[] = [
  REALTIME_TOKEN_EXPIRED,
  REALTIME_SESSION_ENDED,
  REALTIME_AUTHENTICATION_REQUIRED,
];

export function realtimeAuthCode(payload: unknown): RealtimeAuthCode | null {
  const code =
    (payload as { code?: unknown; data?: { code?: unknown } } | null)?.code ??
    (payload as { data?: { code?: unknown } } | null)?.data?.code;
  return typeof code === 'string' && AUTH_CODES.includes(code) ? (code as RealtimeAuthCode) : null;
}

/** The parts of a socket.io-client Socket this needs, so web and mobile can share it. */
export interface RecoverableSocket {
  auth: unknown;
  connected: boolean;
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  off(event: string, listener: (...args: unknown[]) => void): unknown;
  connect(): unknown;
}

export interface RealtimeSessionRecoveryOptions {
  /** Resolves true once a fresh access token is stored. */
  refresh: () => Promise<boolean>;
  getToken: () => string | null;
  /** The refresh was refused: the caller signs the user out. */
  onSignedOut: () => void;
  /** Still signed in but the refresh got no answer (offline, rate limited): try again after this. */
  retryDelayMs?: number;
}

const DEFAULT_RETRY_DELAY_MS = 15_000;
// A fresh token the server still refuses would otherwise reconnect in a loop.
const MAX_ATTEMPTS = 3;
const STABLE_CONNECTION_MS = 60_000;

/**
 * socket.io never reconnects after the server disconnects it, so an expired token or ended session
 * would leave the socket dead. Returns a detach function.
 */
export function attachRealtimeSessionRecovery(
  socket: RecoverableSocket,
  options: RealtimeSessionRecoveryOptions
): () => void {
  let pendingCode: RealtimeAuthCode | null = null;
  let recovering = false;
  let attempts = 0;
  let lastRecoveryAt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let detached = false;

  const recover = async () => {
    if (recovering || detached) return;
    recovering = true;
    try {
      if (Date.now() - lastRecoveryAt > STABLE_CONNECTION_MS) attempts = 0;
      lastRecoveryAt = Date.now();
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) return;
      const refreshed = await options.refresh();
      if (detached) return;
      const token = options.getToken();
      if (refreshed && token) {
        socket.auth = { token };
        socket.connect();
        return;
      }
      if (!token) {
        options.onSignedOut();
        return;
      }
      // Waiting out an unanswered refresh is not a refused connection.
      attempts -= 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void recover();
      }, options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);
    } finally {
      recovering = false;
    }
  };

  const onConnectionError = (payload: unknown) => {
    pendingCode = realtimeAuthCode(payload);
  };
  const onConnectError = (error: unknown) => {
    if (realtimeAuthCode(error) ?? pendingCode) void recover();
  };
  const onDisconnect = (reason: unknown) => {
    const code = pendingCode;
    pendingCode = null;
    if (reason === 'io server disconnect' && code) void recover();
  };
  const onConnect = () => {
    pendingCode = null;
  };

  socket.on('connection_error', onConnectionError);
  socket.on('connect_error', onConnectError);
  socket.on('disconnect', onDisconnect);
  socket.on('connect', onConnect);

  return () => {
    detached = true;
    if (retryTimer) clearTimeout(retryTimer);
    socket.off('connection_error', onConnectionError);
    socket.off('connect_error', onConnectError);
    socket.off('disconnect', onDisconnect);
    socket.off('connect', onConnect);
  };
}
