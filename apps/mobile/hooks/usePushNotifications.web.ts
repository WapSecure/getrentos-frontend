/**
 * Push notifications are native-only: expo-notifications has no web
 * implementation, and its hooks throw there. On web (Expo's browser build,
 * used for previews and checks) this hook does nothing.
 */
export function usePushNotifications() {}
