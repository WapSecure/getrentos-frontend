import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { canLockWithBiometrics, forgetLockKey } from './auth/lockedSession';
import { secureStorage } from './storage';

export const APP_LOCK_KEY = 'sureground.appLock';

interface LockState {
  enabled: boolean | null;
  locked: boolean;
  foreground: boolean;
}

// Locked until the session proves otherwise, so nothing renders unguarded while the flag loads.
let state: LockState = { enabled: null, locked: true, foreground: true };
const listeners = new Set<() => void>();

function update(next: Partial<LockState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let loading: Promise<boolean> | null = null;

/** Reads the flag from secure storage, moving one left in AsyncStorage by an older build. */
export function loadAppLockFlag(): Promise<boolean> {
  loading ??= (async () => {
    let value = await secureStorage.get(APP_LOCK_KEY).catch(() => null);
    const legacy = await AsyncStorage.getItem(APP_LOCK_KEY).catch(() => null);
    if (legacy !== null) {
      let moved = value !== null;
      if (!moved) {
        moved = await secureStorage
          .set(APP_LOCK_KEY, legacy)
          .then(() => true)
          .catch(() => false);
        value = legacy;
      }
      if (moved) await AsyncStorage.removeItem(APP_LOCK_KEY).catch(() => undefined);
    }
    update({ enabled: value === '1' });
    return value === '1';
  })();
  return loading;
}

export async function saveAppLockFlag(next: boolean): Promise<void> {
  await secureStorage.set(APP_LOCK_KEY, next ? '1' : '0');
  update({ enabled: next });
}

export function isAppLockEnabled(): boolean {
  return state.enabled === true;
}

export function isAppLocked(): boolean {
  return state.locked;
}

export function setAppLocked(locked: boolean) {
  if (locked) forgetLockKey();
  if (state.locked !== locked) update({ locked });
}

export function setAppForeground(foreground: boolean) {
  if (state.foreground !== foreground) update({ foreground });
}

function sessionUsable() {
  return state.enabled !== true || (!state.locked && state.foreground);
}

// A rotated refresh token is sealed with the key held only while unlocked, so a refresh waits for an unlocked app on screen.
export function waitUntilUnlocked(): Promise<void> {
  if (sessionUsable()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = subscribe(() => {
      if (!sessionUsable()) return;
      unsubscribe();
      resolve();
    });
  });
}

export function useAppLockEnabled() {
  const enabled = useSyncExternalStore(
    subscribe,
    () => state.enabled,
    () => state.enabled
  );
  return { enabled };
}

export function useAppLocked() {
  return useSyncExternalStore(
    subscribe,
    () => state.locked,
    () => state.locked
  );
}

export type AppLockChange = 'done' | 'unavailable' | 'cancelled' | 'failed' | 'signedOut';

/** What to tell someone after they switch the lock; `null` when nothing needs saying. */
export function appLockChangeMessage(
  change: AppLockChange,
  on: boolean,
  label: string
): { message: string; tone: 'success' | 'error' } | null {
  switch (change) {
    case 'done':
      return { message: `${label} lock is ${on ? 'on' : 'off'}.`, tone: 'success' };
    case 'unavailable':
      return {
        message: `Set up ${label} in your phone’s settings to lock Sureground.`,
        tone: 'error',
      };
    case 'failed':
      return {
        message: `We couldn’t ${on ? 'turn on' : 'turn off'} the ${label} lock. Try again.`,
        tone: 'error',
      };
    default:
      return null;
  }
}

export interface BiometricSupport {
  available: boolean;
  /** Biometrics strong enough to bind the saved session to; without them the lock can't be turned on. */
  canLock: boolean;
  label: string;
}

export async function biometricSupport(): Promise<BiometricSupport> {
  if (Platform.OS === 'web') return { available: false, canLock: false, label: 'biometrics' };
  const [hardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]).catch((): [boolean, boolean, LocalAuthentication.AuthenticationType[]] => [false, false, []]);
  const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const label =
    Platform.OS === 'ios' ? (face ? 'Face ID' : 'Touch ID') : face ? 'face unlock' : 'fingerprint';
  const available = hardware && enrolled;
  return { available, canLock: available && canLockWithBiometrics(), label };
}

export async function unlockWithBiometrics(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  }).catch(() => ({ success: false }));
  return result.success;
}
