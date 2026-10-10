import { ROUTES } from '@/lib/constants/auth';

export type NotificationPortal = 'renter' | 'landlord' | 'owner' | 'buyer' | 'realtor' | 'agent';

const MESSAGES: Record<NotificationPortal, string> = {
  renter: ROUTES.RENTER_MESSAGES,
  landlord: ROUTES.LANDLORD_MESSAGES,
  owner: ROUTES.OWNER_MESSAGES,
  buyer: ROUTES.BUYER_MESSAGES,
  realtor: ROUTES.REALTOR_MESSAGES,
  agent: ROUTES.AGENT_MESSAGES,
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
  if (url === SHORTLET_INBOX || (!url && (isMessage || n.conversationId))) return MESSAGES[portal];
  if (url && url.startsWith('/') && !url.startsWith('//')) return url;
  return null;
}
