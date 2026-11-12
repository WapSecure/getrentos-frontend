import type { Portal } from './roles';
import { developmentRoute, developmentRouteForPath } from './askDeveloper';
import { isDevelopmentId } from './developments';

// Never return a route that does not exist: unmapped paths fall back by type, then to the inbox.
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
  '/landlord/viewing-requests': '/(app)/landlord-viewings',
  '/owner/offers': '/(app)/(owner)/offers',
  '/owner/properties': '/(app)/(owner)/properties',
  '/owner/transactions': '/(app)/owner-transactions',
  '/owner/messages': '/(app)/(owner)/messages',
  '/owner/viewings': '/(app)/owner-viewings',
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
  '/land/consents': '/(app)/land-consents',
  '/land/watch': '/(app)/land-watch',
  '/land/inspections': '/(app)/land-inspections',
  '/owner/managed': '/(app)/managed-properties',
  '/owner/management': '/(app)/get-managed',
  '/landlord/managed': '/(app)/get-managed',
  '/owner/estate-agreements': '/(app)/estate-agreements',
  '/owner/shortlets': '/(app)/host',
  '/owner/home-management': '/(app)/home-care',
  '/landlord/home-management': '/(app)/home-care',
  '/landlord/shortlets': '/(app)/host',
  '/landlord/trust-profile': '/(app)/landlord-trust-profile',
  '/landlord/verification': '/(app)/verify-identity',
  '/estate/trust-profile': '/(app)/estate-trust-profile',
  '/estate/verification': '/(app)/verify-identity',
  '/buyer/trust-profile': '/(app)/buyer-trust-profile',
  '/buyer/verification': '/(app)/verify-identity',
  '/agent/trust-profile': '/(app)/agent-trust-profile',
  '/agent/verification': '/(app)/verify-identity',
  '/landlord/billing': '/(app)/billing',
  '/landlord/realtors': '/(app)/representatives',
  '/estate/dashboard': '/(app)/(estate)',
  '/estate/households': '/(app)/(estate)/households',
  '/estate/dues': '/(app)/(estate)/dues',
  '/estate/announcements': '/(app)/estate-announcements',
  '/estate/billing': '/(app)/billing',
  '/estate/incidents': '/(app)/estate-incidents',
  '/estate/maintenance': '/(app)/estate-maintenance',
  '/estate/marketplace': '/(app)/estate-marketplace',
  '/estate/vehicles': '/(app)/estate-vehicles',
  '/estate/deliveries': '/(app)/estate-deliveries',
  '/estate/contractors': '/(app)/estate-contractors',
  '/estate/dwell': '/(app)/estate-dwell',
  '/estate/patrol': '/(app)/estate-patrol',
  '/estate/staff': '/(app)/estate-staff',
  '/estate/governance': '/(app)/estate-governance',
  '/estate/committee': '/(app)/estate-committee',
  '/estate/financials': '/(app)/estate-financials',
  '/estate/microsite': '/(app)/estate-microsite',
  '/estate/leads': '/(app)/estate-enquiries',
  '/shortlets/messages': '/(app)/shortlet-messages',
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
  '/resident/governance': '/(app)/governance',
  '/resident/committee': '/(app)/committee',
};

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

const OWNER_FALLBACK: [prefix: string, route: string][] = [
  ['ESTATE_LISTING_REQUESTED', '/(app)/estate-agreements'],
  ['OFFER_', '/(app)/(owner)/offers'],
  ['ESCROW_', '/(app)/owner-transactions'],
  ['REALTOR_CLIENT_', '/(app)/representatives'],
];

// A realtor's "commission earned" arrives typed as the escrow release that earned it.
const LANDLORD_FALLBACK: [prefix: string, route: string][] = [
  ['ESTATE_LISTING_REQUESTED', '/(app)/estate-agreements'],
  ['RENT_', '/(app)/landlord-payments'],
  ['PAYMENT_', '/(app)/landlord-payments'],
  ['LEASE_', '/(app)/landlord-leases'],
  ['APPLICATION_', '/(app)/landlord-applications'],
  ['MAINTENANCE_', '/(app)/landlord-maintenance'],
  ['LEAD_', '/(app)/landlord-leads'],
  ['REVIEW_', '/(app)/landlord-reviews'],
  ['MESSAGE', '/(app)/(landlord)/messages'],
];

const REALTOR_FALLBACK: [prefix: string, route: string][] = [
  ['ESCROW_', '/(app)/realtor-commissions'],
  ['OFFER_', '/(app)/realtor-offers'],
  ['REALTOR_CLIENT_', '/(app)/realtor-clients'],
];

const ESTATE_FALLBACK: [prefix: string, route: string][] = [
  ['ESTATE_LISTING_DECIDED', '/(app)/estate-marketplace'],
  ['ESTATE_DUE_', '/(app)/(estate)/dues'],
  ['ESTATE_ANNOUNCEMENT_', '/(app)/estate-announcements'],
  ['ESTATE_INCIDENT_', '/(app)/estate-incidents'],
  ['ESTATE_MAINTENANCE_', '/(app)/estate-maintenance'],
  ['ESTATE_EMERGENCY_', '/(app)/estate-emergency'],
  ['ESTATE_WATCHLIST_', '/(app)/estate-watchlist'],
  // Before the ESTATE_VISIT prefix, which would otherwise catch an overstay.
  ['ESTATE_VISIT_OVERSTAY', '/(app)/estate-dwell'],
  ['ESTATE_PATROL_', '/(app)/estate-patrol'],
  ['ESTATE_VISIT', '/(app)/estate-visitors'],
  ['ESTATE_POLL_', '/(app)/estate-polls'],
];

const HOST_PORTALS = new Set<Portal>(['owner', 'landlord']);

// Others (confirmed, cancelled) go to whichever side didn't act, so they can't be routed by type alone.
const HOST_ONLY_TYPES = new Set(['SHORTLET_BOOKING_REQUEST', 'SHORTLET_REVIEW_RECEIVED']);

const GUEST_PORTALS = new Set<Portal>(['renter', 'buyer']);

const PORTALS_WITH_INBOX = new Set<Portal>([
  'renter',
  'buyer',
  'landlord',
  'agent',
  'owner',
  'realtor',
]);

export function routeForActionUrl(url?: string | null): string | null {
  if (!url) return null;
  // Tolerate absolute URLs and a `/dashboard` prefix the web sometimes uses.
  const path = url
    .replace(/^https?:\/\/[^/]+/, '')
    .split(/[?#]/)[0]
    .replace(/^\/dashboard/, '')
    .replace(/\/$/, '');
  if (WEB_PATH_TO_ROUTE[path]) return WEB_PATH_TO_ROUTE[path];
  if (path.startsWith('/owner/land/')) return '/(app)/owner-land';
  return developmentRouteForPath(path);
}

const CONVERSATION_ROUTE: Partial<Record<Portal, string>> = {
  renter: '/(app)/conversation',
  landlord: '/(app)/landlord-conversation',
  owner: '/(app)/owner-conversation',
  buyer: '/(app)/buyer-conversation',
  realtor: '/(app)/realtor-conversation',
  agent: '/(app)/agent-conversation',
};

export function routeForNotification(
  {
    actionUrl,
    type,
    bookingId,
    conversationId,
    developmentId,
  }: {
    actionUrl?: string | null;
    type?: string | null;
    bookingId?: string | null;
    conversationId?: string | null;
    developmentId?: string | null;
  },
  portal: Portal | null
): string {
  if (type === 'NEW_MESSAGE' && conversationId) {
    const id = encodeURIComponent(conversationId);
    if (routeForActionUrl(actionUrl) === '/(app)/shortlet-messages') {
      return `/(app)/shortlet-conversation/${id}`;
    }
    const chat = portal ? CONVERSATION_ROUTE[portal] : undefined;
    if (chat) return `${chat}/${id}`;
  }
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
  // The developer answered: their answer shows under "Your questions" on the development screen.
  if (type === 'DEVELOPMENT_ENQUIRY_ANSWERED' && isDevelopmentId(developmentId)) {
    return developmentRoute(developmentId);
  }
  if (portal && HOST_PORTALS.has(portal) && type && HOST_ONLY_TYPES.has(type)) {
    return bookingId && type === 'SHORTLET_BOOKING_REQUEST'
      ? `/(app)/host/booking/${bookingId}`
      : '/(app)/host';
  }
  const sellerSide =
    portal === 'owner'
      ? OWNER_FALLBACK
      : portal === 'landlord'
        ? LANDLORD_FALLBACK
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
