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
  '/owner/billing': '/(app)/billing',
  '/owner/realtors': '/(app)/representatives',
  '/owner/land': '/(app)/owner-land',
  '/owner/managed': '/(app)/managed-properties',
  '/owner/estate-agreements': '/(app)/estate-agreements',
  '/owner/shortlets': '/(app)/host',
  '/owner/home-management': '/(app)/home-care',
  '/landlord/home-management': '/(app)/home-care',
  '/landlord/shortlets': '/(app)/host',
  '/landlord/billing': '/(app)/billing',
  '/landlord/realtors': '/(app)/representatives',
  '/estate/dashboard': '/(app)/(estate)',
  '/estate/households': '/(app)/(estate)/households',
  '/estate/dues': '/(app)/(estate)/dues',
  '/estate/announcements': '/(app)/estate-announcements',
  '/estate/billing': '/(app)/billing',
  '/estate/incidents': '/(app)/estate-incidents',
  '/estate/maintenance': '/(app)/estate-maintenance',
  '/estate/violations': '/(app)/estate-violations',
  '/estate/emergency': '/(app)/estate-emergency',
  '/estate/visitor-passes': '/(app)/estate-visitors',
  '/estate/watchlist': '/(app)/estate-watchlist',
  '/resident/violations': '/(app)/violations',
  '/resident/amenities': '/(app)/amenities',
  '/estate/polls': '/(app)/estate-polls',
  '/estate/amenities': '/(app)/estate-amenities',
  '/estate/expected': '/(app)/estate-expected',
  '/realtor/dashboard': '/(app)/(realtor)',
  '/realtor/clients': '/(app)/realtor-clients',
  '/realtor/listings': '/(app)/(realtor)/listings',
  '/realtor/leads': '/(app)/(realtor)/pipeline',
  '/realtor/viewings': '/(app)/(realtor)/pipeline',
  '/realtor/offers': '/(app)/realtor-offers',
  '/realtor/commissions': '/(app)/realtor-commissions',
  '/realtor/documents': '/(app)/realtor-documents',
  '/realtor/messages': '/(app)/(realtor)/messages',
  '/realtor/reviews': '/(app)/realtor-reviews',
  '/realtor/trust-profile': '/(app)/realtor-trust-profile',
  '/realtor/verification': '/(app)/verify-identity',
  '/realtor/billing': '/(app)/billing',
  '/realtor/managed': '/(app)/managed-properties',
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

/**
 * Realtor-side screens. A realtor's "commission earned" arrives typed as the
 * escrow release that earned it, and their offers are the ones they negotiate.
 */
const REALTOR_FALLBACK: [prefix: string, route: string][] = [
  ['ESCROW_', '/(app)/realtor-commissions'],
  ['OFFER_', '/(app)/realtor-offers'],
];

/** The estate office sees its residents' dues, not a resident's own. */
const ESTATE_FALLBACK: [prefix: string, route: string][] = [
  ['ESTATE_DUE_', '/(app)/(estate)/dues'],
  ['ESTATE_ANNOUNCEMENT_', '/(app)/estate-announcements'],
  ['ESTATE_INCIDENT_', '/(app)/estate-incidents'],
  ['ESTATE_MAINTENANCE_', '/(app)/estate-maintenance'],
  ['ESTATE_EMERGENCY_', '/(app)/estate-emergency'],
  ['ESTATE_WATCHLIST_', '/(app)/estate-watchlist'],
  ['ESTATE_VISIT', '/(app)/estate-visitors'],
  ['ESTATE_POLL_', '/(app)/estate-polls'],
];

/** Portals that host short stays; their shortlet notifications are the host's side. */
const HOST_PORTALS = new Set<Portal>(['owner', 'landlord']);

/**
 * Shortlet notifications only ever sent to the host. Others (confirmed,
 * cancelled) go to whichever side didn't act, so they can't be routed by
 * type alone.
 */
const HOST_ONLY_TYPES = new Set(['SHORTLET_BOOKING_REQUEST', 'SHORTLET_REVIEW_RECEIVED']);

/** Portals that book short stays as guests. */
const GUEST_PORTALS = new Set<Portal>(['renter', 'buyer']);

/** Portals whose tab bar has a Messages tab. */
const PORTALS_WITH_INBOX = new Set<Portal>([
  'renter',
  'buyer',
  'landlord',
  'agent',
  'owner',
  'realtor',
]);

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
  {
    actionUrl,
    type,
    bookingId,
  }: { actionUrl?: string | null; type?: string | null; bookingId?: string | null },
  portal: Portal | null
): string {
  // A guest's stay notification opens that stay: status, money and what to do next.
  if (
    bookingId &&
    type?.startsWith('SHORTLET_') &&
    !HOST_ONLY_TYPES.has(type) &&
    portal &&
    GUEST_PORTALS.has(portal)
  ) {
    return `/(app)/shortlet-stay/${bookingId}`;
  }
  const direct = routeForActionUrl(actionUrl);
  if (direct) return direct;
  // A host is told about a request on their listing: open that booking.
  if (portal && HOST_PORTALS.has(portal) && type && HOST_ONLY_TYPES.has(type)) {
    return bookingId && type === 'SHORTLET_BOOKING_REQUEST'
      ? `/(app)/host/booking/${bookingId}`
      : '/(app)/host';
  }
  // Sellers see offers and escrow from the other side of the table.
  const sellerSide =
    portal === 'owner'
      ? OWNER_FALLBACK
      : portal === 'realtor'
        ? REALTOR_FALLBACK
        : portal === 'estate'
          ? ESTATE_FALLBACK
          : null;
  const portalFallback =
    sellerSide && type ? sellerSide.find(([prefix]) => type.startsWith(prefix))?.[1] : undefined;
  if (portalFallback) return portalFallback;
  const byType = type ? TYPE_FALLBACK.find(([prefix]) => type.startsWith(prefix))?.[1] : null;
  if (byType) return byType;
  if (type === 'NEW_MESSAGE' && portal && PORTALS_WITH_INBOX.has(portal)) {
    return `/(app)/(${portal})/messages`;
  }
  return '/(app)/notifications';
}
