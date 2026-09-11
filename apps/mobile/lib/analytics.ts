/**
 * Analytics + error-reporting seam.
 *
 * One indirection so screens call `track(...)` / `report(...)` today against a
 * dev console sink, and a real provider (PostHog, Segment, Sentry) is wired in
 * here later without touching call sites. Never throws — instrumentation must
 * not be able to break a screen.
 */

type Props = Record<string, string | number | boolean | null | undefined>;

/** Domain events. Add to the union as screens need them — keeps names greppable. */
export type AnalyticsEvent =
  | 'app_error'
  | 'sign_in'
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'listing_viewed'
  | 'listing_saved'
  | 'listing_unsaved'
  | 'search_performed'
  | 'filters_applied'
  | 'sort_changed'
  | 'application_started'
  | 'application_submitted'
  | 'viewing_requested'
  | 'message_sent'
  | 'rent_payment_started';

let userId: string | null = null;

export function identify(id: string, traits?: Props): void {
  userId = id;
  if (__DEV__) console.log('[analytics] identify', id, traits ?? {});
}

export function reset(): void {
  userId = null;
  if (__DEV__) console.log('[analytics] reset');
}

export function track(event: AnalyticsEvent, props?: Props): void {
  try {
    if (__DEV__) console.log('[analytics]', event, { userId, ...props });
    // TODO: forward to the real provider once configured.
  } catch {
    /* never throw from instrumentation */
  }
}

/** Non-fatal error reporting (caught exceptions, failed mutations). */
export function report(error: unknown, context?: Props): void {
  try {
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) console.warn('[report]', message, context ?? {});
    // TODO: forward to Sentry/Crashlytics once configured.
  } catch {
    /* swallow */
  }
}
