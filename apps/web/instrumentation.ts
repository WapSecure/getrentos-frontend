import type { Instrumentation } from 'next';

const dsn = process.env.SENTRY_DSN;

export async function register() {
  if (!dsn || process.env.NEXT_RUNTIME !== 'nodejs') return;
  const [Sentry, { scrubbedSentryOptions }] = await Promise.all([
    import('@sentry/nextjs'),
    import('@sureground/shared/sentryScrub'),
  ]);
  Sentry.init(scrubbedSentryOptions(dsn));
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!dsn || process.env.NEXT_RUNTIME !== 'nodejs') return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
