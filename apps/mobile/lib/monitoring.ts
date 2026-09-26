import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !__DEV__ && Boolean(dsn),
  sendDefaultPii: false,
  tracesSampleRate: __DEV__ ? 0 : 0.1,
  enableNativeFramesTracking: true,
});

export { Sentry };
