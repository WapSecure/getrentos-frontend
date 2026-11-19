const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Loaded only when a DSN is set, so builds without one never fetch the SDK chunk.
if (dsn) {
  void Promise.all([import('@sentry/nextjs'), import('@sureground/shared/sentryScrub')]).then(
    ([Sentry, { scrubbedSentryOptions }]) => Sentry.init(scrubbedSentryOptions(dsn))
  );
}
