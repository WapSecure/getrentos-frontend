import { router, type Href } from 'expo-router';
import type { MarketKind } from './api/publicMarket';
import type { Portal } from './roles';

// Memory only and short-lived: an abandoned sign-in's intent must not hijack a later one.

const TTL_MS = 30 * 60 * 1000;

let pending: { kind: MarketKind; id: string; at: number } | null = null;

export function rememberListing(kind: MarketKind, id: string) {
  pending = { kind, id, at: Date.now() };
}

export function forgetListing() {
  pending = null;
}

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

export const LISTING_AUDIENCE: Partial<Record<MarketKind, string>> = {
  rent: 'renter',
  sale: 'buyer',
};

export function takeListingHref(portal: Portal, now = Date.now()): Href | null {
  return takeListingIntent(portal, now).href;
}

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

export function openMarketListing(kind: MarketKind, id: string, portal: Portal | null) {
  const inApp = portal && inAppListingHref(kind, id, portal);
  if (inApp) {
    router.push(inApp as never);
    return;
  }
  rememberListing(kind, id);
  router.push({ pathname: '/(market)/listing/[kind]/[id]', params: { kind, id } });
}
