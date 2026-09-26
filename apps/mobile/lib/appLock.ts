import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * App lock: Face ID / fingerprint before the app shows anything, for people
 * who hand their phone around. Off by default, per device.
 */

const KEY = 'getrentos.appLock';

let enabled: boolean | null = null;
const listeners = new Set<() => void>();
const set = (next: boolean) => {
  enabled = next;
  listeners.forEach((l) => l());
};
let loading: Promise<void> | null = null;
const load = () =>
  (loading ??= AsyncStorage.getItem(KEY)
    .then((v) => {
      if (enabled === null) set(v === '1');
    })
    .catch(() => set(false)));

/** `null` while the stored setting is being read. */
export function useAppLockEnabled() {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => enabled,
    () => enabled
  );
  useEffect(() => {
    load();
  }, []);
  const setEnabled = useCallback((next: boolean) => {
    set(next);
    AsyncStorage.setItem(KEY, next ? '1' : '0').catch(() => undefined);
  }, []);
  return { enabled: value, setEnabled };
}

export interface BiometricSupport {
  available: boolean;
  /** "Face ID", "Touch ID", "fingerprint" or "face unlock" — for button copy. */
  label: string;
}

/** Whether this phone can do biometrics and has them set up. */
export async function biometricSupport(): Promise<BiometricSupport> {
  if (Platform.OS === 'web') return { available: false, label: 'biometrics' };
  const [hardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]).catch((): [boolean, boolean, LocalAuthentication.AuthenticationType[]] => [false, false, []]);
  const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const label =
    Platform.OS === 'ios' ? (face ? 'Face ID' : 'Touch ID') : face ? 'face unlock' : 'fingerprint';
  return { available: hardware && enrolled, label };
}

/** Prompts for biometrics (falling back to the phone's passcode). */
export async function unlockWithBiometrics(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use passcode',
  }).catch(() => ({ success: false }));
  return result.success;
}
