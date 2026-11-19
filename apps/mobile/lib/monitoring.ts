import * as Sentry from '@sentry/react-native';
import { scrubBreadcrumb, scrubEvent } from '@sureground/shared/sentryScrub';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !__DEV__ && Boolean(dsn),
  sendDefaultPii: false,
  tracesSampleRate: __DEV__ ? 0 : 0.1,
  enableNativeFramesTracking: true,
  attachScreenshot: false,
  attachViewHierarchy: false,
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
});

export { Sentry };
