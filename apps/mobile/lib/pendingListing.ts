import type { Href } from 'expo-router';
import type { MarketKind } from './api/publicMarket';
import type { Portal } from './roles';

/**
 * "Sign in to enquire" on a public listing should end on that listing, not on a
 * dashboard the visitor then has to search again. The public page records the
 * listing here; the root router picks it up once the session exists.
 *
 * Memory only, and short-lived: an intent from a sign-in abandoned an hour ago
 * should not hijack a later, unrelated sign-in.
 */

const TTL_MS = 30 * 60 * 1000;

let pending: { kind: MarketKind; id: string; at: number } | null = null;

export function rememberListing(kind: MarketKind, id: string) {
  pending = { kind, id, at: Date.now() };
}

export function forgetListing() {
  pending = null;
}

/**
 * The signed-in screen that shows this listing, or null when the user's portal
 * has none — rentals come from the renter API and sales from the buyer API,
 * both role-gated; shortlets and land are public and open for everyone.
 */
export function inAppListingHref(kind: MarketKind, id: string, portal: Portal): Href | null {
  switch (kind) {
    case 'shortlet':
      return { pathname: '/(app)/shortlet/[id]', params: { id } };
    case 'land':
      return { pathname: '/(app)/land-listing/[id]', params: { id } };
    case 'rent':
      return portal === 'renter' ? { pathname: '/(app)/property/[id]', params: { id } } : null;
    case 'sale':
      return portal === 'buyer' ? { pathname: '/(app)/buyer-listing/[id]', params: { id } } : null;
  }
}

/** Takes the pending listing (once) as a route for this portal, if it is still fresh. */
export function takeListingHref(portal: Portal, now = Date.now()): Href | null {
  const intent = pending;
  pending = null;
  if (!intent || now - intent.at > TTL_MS) return null;
  return inAppListingHref(intent.kind, intent.id, portal);
}
