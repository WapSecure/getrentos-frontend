import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Updates from 'expo-updates';
import { track } from '@/lib/analytics';

/** Don't ask the update server more often than this. */
const MIN_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Keeps the JavaScript up to date between store releases. Checks when the app
 * comes to the foreground and downloads in the background; the new version
 * applies on the next launch, so nobody is interrupted mid-task.
 *
 * Inactive in development and Expo Go (`Updates.isEnabled` is false there).
 */
export function useOverTheAirUpdates() {
  const lastCheck = useRef(0);

  useEffect(() => {
    if (!Updates.isEnabled || __DEV__) return;

    const check = async () => {
      if (Date.now() - lastCheck.current < MIN_INTERVAL_MS) return;
      lastCheck.current = Date.now();
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (!isAvailable) return;
        const { isNew } = await Updates.fetchUpdateAsync();
        if (isNew) track('ota_update_downloaded');
      } catch {
        // Offline or the update server is down — try again next time.
      }
    };

    check();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, []);
}
