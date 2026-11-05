import { router, type Href } from 'expo-router';
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

const freshIntent = (now: number) => (pending && now - pending.at <= TTL_MS ? pending : null);

/**
 * Which of the user's workspaces should open after sign-in so the pending
 * listing can be shown: the current one when it can, otherwise the first one
 * that can (a realtor who also rents lands in their renter workspace). Null
 * when nothing is pending or no workspace of theirs can open it.
 */
export function portalForPendingListing(
  current: Portal,
  workspaces: readonly Portal[],
  now = Date.now()
): Portal | null {
  const intent = freshIntent(now);
  if (!intent) return null;
  if (inAppListingHref(intent.kind, intent.id, current)) return current;
  return workspaces.find((p) => inAppListingHref(intent.kind, intent.id, p)) ?? null;
}

/** Who a listing of this market is for, when only one kind of account can act on it. */
export const LISTING_AUDIENCE: Partial<Record<MarketKind, string>> = {
  rent: 'renter',
  sale: 'buyer',
};

/** Takes the pending listing (once) as a route for this portal, if it is still fresh. */
export function takeListingHref(portal: Portal, now = Date.now()): Href | null {
  return takeListingIntent(portal, now).href;
}

/**
 * Takes the pending listing (once). `href` is where to open it in this portal;
 * when the portal can't open it, `blockedKind` says which market it was so the
 * user can be told why they landed on their home instead.
 */
export function takeListingIntent(
  portal: Portal,
  now = Date.now()
): { href: Href | null; blockedKind: MarketKind | null } {
  const intent = freshIntent(now);
  pending = null;
  if (!intent) return { href: null, blockedKind: null };
  const href = inAppListingHref(intent.kind, intent.id, portal);
  return { href, blockedKind: href ? null : intent.kind };
}

/**
 * Opens a listing from a page anyone can see (a landlord's or estate's public
 * page): straight into the person's workspace when it shows this kind, else
 * the public listing, remembered so signing in lands back on it.
 */
export function openMarketListing(kind: MarketKind, id: string, portal: Portal | null) {
  const inApp = portal && inAppListingHref(kind, id, portal);
  if (inApp) {
    router.push(inApp as never);
    return;
  }
  rememberListing(kind, id);
  router.push({ pathname: '/(market)/listing/[kind]/[id]', params: { kind, id } });
}
