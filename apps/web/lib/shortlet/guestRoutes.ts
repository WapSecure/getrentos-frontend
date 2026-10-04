import { ROUTES } from '@/lib/constants/auth';
import { viewerRoleIds } from '@/lib/viewer';

/**
 * Account types that can book a short stay, save one and message a host.
 * Mirrors SHORTLET_GUEST_ROLES on the backend: booking a stay is something a
 * person does, so a landlord or an agent can do it from their own account.
 */
export const SHORTLET_GUEST_ROLE_IDS = ['renter', 'buyer', 'landlord', 'owner', 'realtor', 'agent'];

/** Where a guest of each account type verifies their identity and finds their stays. */
const GUEST_ROUTES: Record<string, { verification: string; bookings: string }> = {
  renter: { verification: ROUTES.RENTER_VERIFICATION, bookings: ROUTES.RENTER_BOOKINGS },
  buyer: { verification: ROUTES.BUYER_VERIFICATION, bookings: ROUTES.BUYER_BOOKINGS },
  landlord: { verification: ROUTES.LANDLORD_VERIFICATION, bookings: ROUTES.LANDLORD_BOOKINGS },
  owner: { verification: ROUTES.OWNER_VERIFICATION, bookings: ROUTES.OWNER_BOOKINGS },
  realtor: { verification: ROUTES.REALTOR_VERIFICATION, bookings: ROUTES.REALTOR_BOOKINGS },
  agent: { verification: ROUTES.AGENT_VERIFICATION, bookings: ROUTES.AGENT_BOOKINGS },
};

/**
 * The signed-in viewer's own verification and "my stays" pages. Falls back to
 * the renter's when the viewer's account type has neither.
 *
 * Reads storage, so call it from a lazy state initializer or an effect.
 */
export const guestStayRoutes = (): { verification: string; bookings: string } => {
  const role = viewerRoleIds().find((id) => id in GUEST_ROUTES);
  return GUEST_ROUTES[role ?? 'renter'];
};
