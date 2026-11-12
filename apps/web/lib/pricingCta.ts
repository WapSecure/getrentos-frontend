import { ROUTES, getDashboardRoute } from '@sureground/shared';

// Roles whose workspace has a billing page where the plan is managed.
const BILLING_BY_ROLE: Record<string, string> = {
  landlord: ROUTES.LANDLORD_BILLING,
  owner: ROUTES.OWNER_BILLING,
  realtor: ROUTES.REALTOR_BILLING,
  estate: ROUTES.ESTATE_BILLING,
};

export interface SignedInPricingLinks {
  dashboard: string;
  /** Present only for roles that have a billing page. */
  billing?: string;
}

/** Where a signed-in visitor on the pricing page should go instead of sign-up or sign-in. */
export function signedInPricingLinks(role: string | null | undefined): SignedInPricingLinks {
  const roleId = role || 'renter';
  const billing = BILLING_BY_ROLE[roleId];
  return billing
    ? { dashboard: getDashboardRoute(roleId), billing }
    : { dashboard: getDashboardRoute(roleId) };
}
