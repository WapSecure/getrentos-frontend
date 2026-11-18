import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  attachRealtimeSessionRecovery,
  realtimeAuthCode,
} from '../src/realtime/sessionRecovery.ts';

type Listener = (...args: unknown[]) => void;

function fakeSocket() {
  const listeners = new Map<string, Set<Listener>>();
  const socket = {
    auth: { token: 'old' } as unknown,
    connected: true,
    connects: 0,
    on(event: string, listener: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    },
    off(event: string, listener: Listener) {
      listeners.get(event)?.delete(listener);
    },
    connect() {
      socket.connects += 1;
    },
    emit(event: string, ...args: unknown[]) {
      for (const listener of listeners.get(event) ?? []) listener(...args);
    },
  };
  return socket;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('reads the code from the gateway payload', () => {
  assert.equal(realtimeAuthCode({ code: 'TOKEN_EXPIRED' }), 'TOKEN_EXPIRED');
  assert.equal(realtimeAuthCode({ code: 'SOMETHING_ELSE' }), null);
});

test('an expired token is refreshed and the same socket reconnects with the new one', async () => {
  const socket = fakeSocket();
  let token = 'old';
  attachRealtimeSessionRecovery(socket, {
    refresh: async () => {
      token = 'new';
      return true;
    },
    getToken: () => token,
    onSignedOut: () => assert.fail('should not sign out'),
  });
  socket.emit('connection_error', { code: 'TOKEN_EXPIRED' });
  socket.emit('disconnect', 'io server disconnect');
  await settle();
  assert.deepEqual(socket.auth, { token: 'new' });
  assert.equal(socket.connects, 1);
});

test('an ended session whose refresh is refused signs out', async () => {
  const socket = fakeSocket();
  let signedOut = false;
  attachRealtimeSessionRecovery(socket, {
    refresh: async () => false,
    getToken: () => null,
    onSignedOut: () => {
      signedOut = true;
    },
  });
  socket.emit('connection_error', { code: 'SESSION_ENDED' });
  socket.emit('disconnect', 'io server disconnect');
  await settle();
  assert.equal(signedOut, true);
  assert.equal(socket.connects, 0);
});

test('a dropped connection without an auth code is left to socket.io', async () => {
  const socket = fakeSocket();
  let refreshed = false;
  attachRealtimeSessionRecovery(socket, {
    refresh: async () => {
      refreshed = true;
      return true;
    },
    getToken: () => 'old',
    onSignedOut: () => undefined,
  });
  socket.emit('disconnect', 'transport close');
  await settle();
  assert.equal(refreshed, false);
});
