/**
 * Analytics + error-reporting seam.
 *
 * One indirection so screens call `track(...)` / `report(...)`. Product events
 * become privacy-safe Sentry breadcrumbs and caught failures become reports;
 * development also keeps its readable console sink. Never throws.
 */

import { Sentry } from './monitoring';

type Props = Record<string, string | number | boolean | null | undefined>;

/** Domain events. Add to the union as screens need them — keeps names greppable. */
export type AnalyticsEvent =
  | 'app_error'
  | 'sign_in'
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'listing_viewed'
  | 'market_tab_changed'
  | 'market_estate_opened'
  | 'market_listing_shared'
  | 'market_signin_cta'
  | 'listing_saved'
  | 'listing_unsaved'
  | 'search_performed'
  | 'filters_applied'
  | 'sort_changed'
  | 'discover_view_mode_changed'
  | 'application_started'
  | 'application_submitted'
  | 'application_withdrawn'
  | 'viewing_requested'
  | 'message_sent'
  | 'rent_payment_started';

let userId: string | null = null;

export function identify(id: string, traits?: Props): void {
  userId = id;
  Sentry.setUser({ id });
  if (__DEV__) console.log('[analytics] identify', id, traits ?? {});
}

export function reset(): void {
  userId = null;
  Sentry.setUser(null);
  if (__DEV__) console.log('[analytics] reset');
}

export function track(event: AnalyticsEvent, props?: Props): void {
  try {
    if (__DEV__) console.log('[analytics]', event, { userId, ...props });
    Sentry.addBreadcrumb({ category: 'product', message: event, data: props, level: 'info' });
  } catch {
    /* never throw from instrumentation */
  }
}

/** Non-fatal error reporting (caught exceptions, failed mutations). */
export function report(error: unknown, context?: Props): void {
  try {
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) console.warn('[report]', message, context ?? {});
    Sentry.captureException(error instanceof Error ? error : new Error(message), {
      extra: context,
    });
  } catch {
    /* swallow */
  }
}
