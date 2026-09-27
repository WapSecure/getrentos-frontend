import type { Portal } from './roles';

/**
 * Where a notification should take you in the app.
 *
 * The API speaks in web paths (`/renter/payments`) because the same
 * notification also shows on the website. Map the ones the app implements onto
 * native routes; anything unmapped falls back by type, then to the inbox —
 * never to a route that does not exist.
 */
const WEB_PATH_TO_ROUTE: Record<string, string> = {
  '/renter/payments': '/(app)/payments',
  '/renter/applications': '/(app)/(renter)/applications',
  '/renter/maintenance': '/(app)/renter-maintenance',
  '/renter/messages': '/(app)/(renter)/messages',
  '/renter/lease': '/(app)/lease',
  '/renter/documents': '/(app)/documents',
  '/renter/saved': '/(app)/saved',
  '/renter/trust-score': '/(app)/trust-score',
  '/renter/viewings': '/(app)/viewings',
  '/renter/roommates': '/(app)/roommates',
  '/buyer/offers': '/(app)/(buyer)/offers',
  '/buyer/transactions': '/(app)/buyer-transactions',
  '/buyer/viewings': '/(app)/buyer-viewings',
  '/buyer/messages': '/(app)/(buyer)/messages',
  '/landlord/applications': '/(app)/landlord-applications',
  '/landlord/payments': '/(app)/landlord-payments',
  '/landlord/maintenance': '/(app)/landlord-maintenance',
  '/landlord/leases': '/(app)/landlord-leases',
  '/landlord/messages': '/(app)/(landlord)/messages',
  '/owner/offers': '/(app)/(owner)/offers',
  '/owner/properties': '/(app)/(owner)/properties',
  '/owner/transactions': '/(app)/owner-transactions',
  '/owner/messages': '/(app)/(owner)/messages',
  '/owner/leads': '/(app)/owner-leads',
  '/owner/documents': '/(app)/owner-documents',
  '/owner/reviews': '/(app)/owner-reviews',
  '/owner/analytics': '/(app)/owner-analytics',
  '/owner/trust-profile': '/(app)/owner-trust-profile',
  '/owner/verification': '/(app)/verify-identity',
  '/owner/settings': '/(app)/owner-profile',
  '/owner/dashboard': '/(app)/(owner)',
  '/resident/visitor-passes': '/(app)/visitor-passes',
  '/resident/dues': '/(app)/dues',
  '/resident/deliveries': '/(app)/deliveries',
  '/resident/announcements': '/(app)/(resident)/announcements',
};

/** Type prefix → route, for notifications that carry no usable action URL. */
const TYPE_FALLBACK: [prefix: string, route: string][] = [
  ['ESCROW_', '/(app)/buyer-transactions'],
  ['OFFER_', '/(app)/(buyer)/offers'],
  ['RENT_', '/(app)/payments'],
  ['LEASE_', '/(app)/lease'],
  ['SHORTLET_BOOKING_', '/(app)/shortlet-bookings'],
  ['ESTATE_WALK_IN_', '/(app)/visitor-passes'],
  ['ESTATE_VISITOR_', '/(app)/visitor-passes'],
  ['ESTATE_DUE_', '/(app)/dues'],
  ['ESTATE_ANNOUNCEMENT_', '/(app)/(resident)/announcements'],
];

/** Owner-side screens for the same notification types. */
const OWNER_FALLBACK: [prefix: string, route: string][] = [
  ['OFFER_', '/(app)/(owner)/offers'],
  ['ESCROW_', '/(app)/owner-transactions'],
];

/** Portals whose tab bar has a Messages tab. */
const PORTALS_WITH_INBOX = new Set<Portal>(['renter', 'buyer', 'landlord', 'agent', 'owner']);

/** The native route for a web action path, or null if the app has no screen for it. */
export function routeForActionUrl(url?: string | null): string | null {
  if (!url) return null;
  // Tolerate absolute URLs and a `/dashboard` prefix the web sometimes uses.
  const path = url
    .replace(/^https?:\/\/[^/]+/, '')
    .split(/[?#]/)[0]
    .replace(/^\/dashboard/, '')
    .replace(/\/$/, '');
  return WEB_PATH_TO_ROUTE[path] ?? null;
}

/** Where tapping a push notification should land. Always returns a real route. */
export function routeForNotification(
  { actionUrl, type }: { actionUrl?: string | null; type?: string | null },
  portal: Portal | null
): string {
  const direct = routeForActionUrl(actionUrl);
  if (direct) return direct;
  // Sellers see offers and escrow from the other side of the table.
  const portalFallback =
    portal === 'owner' && type
      ? OWNER_FALLBACK.find(([prefix]) => type.startsWith(prefix))?.[1]
      : undefined;
  if (portalFallback) return portalFallback;
  const byType = type ? TYPE_FALLBACK.find(([prefix]) => type.startsWith(prefix))?.[1] : null;
  if (byType) return byType;
  if (type === 'NEW_MESSAGE' && portal && PORTALS_WITH_INBOX.has(portal)) {
    return `/(app)/(${portal})/messages`;
  }
  return '/(app)/notifications';
}
