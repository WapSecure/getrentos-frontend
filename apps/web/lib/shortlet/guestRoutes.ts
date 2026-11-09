import { ROUTES } from '@/lib/constants/auth';
import { viewerRoleIds } from '@/lib/viewer';

// Mirrors SHORTLET_GUEST_ROLES on the backend.
export const SHORTLET_GUEST_ROLE_IDS = ['renter', 'buyer', 'landlord', 'owner', 'realtor', 'agent'];

const GUEST_ROUTES: Record<string, { verification: string; bookings: string }> = {
  renter: { verification: ROUTES.RENTER_VERIFICATION, bookings: ROUTES.RENTER_BOOKINGS },
  buyer: { verification: ROUTES.BUYER_VERIFICATION, bookings: ROUTES.BUYER_BOOKINGS },
  landlord: { verification: ROUTES.LANDLORD_VERIFICATION, bookings: ROUTES.LANDLORD_BOOKINGS },
  owner: { verification: ROUTES.OWNER_VERIFICATION, bookings: ROUTES.OWNER_BOOKINGS },
  realtor: { verification: ROUTES.REALTOR_VERIFICATION, bookings: ROUTES.REALTOR_BOOKINGS },
  agent: { verification: ROUTES.AGENT_VERIFICATION, bookings: ROUTES.AGENT_BOOKINGS },
};

// Reads storage, so call it from a lazy state initializer or an effect.
export const guestStayRoutes = (): { verification: string; bookings: string } => {
  const role = viewerRoleIds().find((id) => id in GUEST_ROUTES);
  return GUEST_ROUTES[role ?? 'renter'];
};
