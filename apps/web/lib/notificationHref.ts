import { ROUTES } from '@/lib/constants/auth';

export type NotificationPortal =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate'
  | 'resident';

const MESSAGES: Partial<Record<NotificationPortal, string>> = {
  renter: ROUTES.RENTER_MESSAGES,
  landlord: ROUTES.LANDLORD_MESSAGES,
  owner: ROUTES.OWNER_MESSAGES,
  buyer: ROUTES.BUYER_MESSAGES,
  realtor: ROUTES.REALTOR_MESSAGES,
  agent: ROUTES.AGENT_MESSAGES,
};

/**
 * Estate notifications mostly carry no link: they are about the estate's own
 * pages, which differ for the office and for a household. Longest prefix wins.
 * Mirrors ESTATE_FALLBACK and TYPE_FALLBACK in the mobile app.
 */
const BY_TYPE: Partial<Record<NotificationPortal, [prefix: string, route: string][]>> = {
  estate: [
    ['estate_due_', ROUTES.ESTATE_DUES],
    ['estate_announcement_', ROUTES.ESTATE_ANNOUNCEMENTS],
    ['estate_incident_', ROUTES.ESTATE_INCIDENTS],
    ['estate_maintenance_', ROUTES.ESTATE_MAINTENANCE],
    ['estate_emergency_', ROUTES.ESTATE_EMERGENCY],
    ['estate_watchlist_', ROUTES.ESTATE_WATCHLIST],
    ['estate_patrol_', ROUTES.ESTATE_PATROL],
    ['estate_visit_overstay', ROUTES.ESTATE_DWELL],
    ['estate_delivery_', ROUTES.ESTATE_DELIVERIES],
    ['estate_poll_', ROUTES.ESTATE_POLLS],
    // The owner's answer to the estate's request to market their property.
    ['estate_listing_decided', '/estate/marketplace'],
  ],
  // An estate asking to market the owner's property.
  owner: [['estate_listing_requested', '/owner/estate-agreements']],
  resident: [
    ['estate_due_', ROUTES.RESIDENT_DUES],
    ['estate_announcement_', ROUTES.RESIDENT_ANNOUNCEMENTS],
    ['estate_visitor_', ROUTES.RESIDENT_VISITOR_PASSES],
    ['estate_walk_in_', ROUTES.RESIDENT_VISITOR_PASSES],
    ['estate_visit_', ROUTES.RESIDENT_VISITOR_PASSES],
    ['estate_maintenance_', ROUTES.RESIDENT_MAINTENANCE],
    ['estate_emergency_', ROUTES.RESIDENT_EMERGENCY],
    ['estate_delivery_', ROUTES.RESIDENT_DELIVERIES],
    ['estate_poll_', ROUTES.RESIDENT_POLLS],
  ],
};

/** The app's own short-stay inbox path; on the web, short-stay chats sit in each portal's Messages. */
const SHORTLET_INBOX = '/shortlets/messages';

/**
 * Where clicking a notification in a portal's bell should go, or null to stay
 * put (it is still marked read).
 *
 * The API sends an in-app `actionUrl` when the notification is about something
 * with its own page, and a `conversationId` on a new message. Mobile has the
 * same rules for its own routes (apps/mobile/lib/notificationRoutes.ts).
 */
export function notificationHref(
  portal: NotificationPortal,
  n: {
    type: string;
    actionUrl?: string;
    conversationId?: string;
    action?: { url: string };
  }
): string | null {
  const url = n.actionUrl ?? n.action?.url;
  const isMessage =
    n.type.toLowerCase() === 'new_message' || (portal === 'renter' && n.type === 'message');
  if (url === SHORTLET_INBOX || (!url && (isMessage || n.conversationId))) {
    return MESSAGES[portal] ?? null;
  }
  if (url && url.startsWith('/') && !url.startsWith('//')) return url;
  const type = n.type.toLowerCase();
  const byType = (BY_TYPE[portal] ?? [])
    .filter(([prefix]) => type.startsWith(prefix))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return byType?.[1] ?? null;
}
