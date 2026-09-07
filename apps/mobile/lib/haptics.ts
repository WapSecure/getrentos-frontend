import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Haptics that silently no-op where the platform can't do them (web preview). */
export const haptics = {
  success: () =>
    Platform.OS === 'web'
      ? Promise.resolve()
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  error: () =>
    Platform.OS === 'web'
      ? Promise.resolve()
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined),
  tap: () =>
    Platform.OS === 'web' ? Promise.resolve() : Haptics.selectionAsync().catch(() => undefined),
};
