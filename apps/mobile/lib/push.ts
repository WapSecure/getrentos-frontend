import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api/client';
import { track } from './analytics';

/**
 * Push notifications: permission, the device's Expo push token, and telling
 * the API which phone belongs to which user. Everything here is best effort —
 * push is an enhancement, so a failure is logged and never blocks sign-in.
 */

const TOKEN_KEY = 'getrentos.pushToken';

// While the app is open, still show the banner — the in-app bell updates too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

function projectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

export type PushRegistration =
  | { status: 'registered'; token: string }
  | { status: 'denied' }
  | { status: 'unavailable'; reason: string };

/**
 * Asks for permission (only if not already decided), gets this phone's token
 * and registers it for the signed-in user.
 */
export async function registerForPush(): Promise<PushRegistration> {
  try {
    if (Platform.OS === 'web') return { status: 'unavailable', reason: 'web' };
    // Simulators have no push token.
    if (!Device.isDevice) return { status: 'unavailable', reason: 'simulator' };
    const id = projectId();
    // Until the app is linked to an EAS project (`eas init`) there is no token to get.
    if (!id) return { status: 'unavailable', reason: 'no EAS project id' };

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status === 'undetermined') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') {
      track('push_permission', { granted: false });
      return { status: 'denied' };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await apiFetch<void>('/users/me/push-devices', {
      method: 'POST',
      body: { token, platform: Platform.OS },
    });
    await AsyncStorage.setItem(TOKEN_KEY, token);
    track('push_permission', { granted: true });
    return { status: 'registered', token };
  } catch (err) {
    return { status: 'unavailable', reason: err instanceof Error ? err.message : 'error' };
  }
}

/**
 * Stops pushes to this phone. Call BEFORE the session is cleared — the API
 * only lets a user remove their own device.
 */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await apiFetch<void>('/users/me/push-devices/remove', { method: 'POST', body: { token } });
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Best effort: the dispatcher also drops tokens Expo reports as dead.
  }
  Notifications.setBadgeCountAsync(0).catch(() => undefined);
}

/** What a tapped notification carries — mirrors the API's push payload. */
export interface PushData {
  notificationId?: string;
  type?: string;
  actionUrl?: string;
}

export function readPushData(response: Notifications.NotificationResponse | null): PushData | null {
  const data = response?.notification.request.content.data as PushData | undefined;
  return data && typeof data === 'object' ? data : null;
}
