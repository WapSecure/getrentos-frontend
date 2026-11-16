import { ROUTES, getDashboardRoute } from '@sureground/shared';

const BILLING_BY_ROLE: Record<string, string> = {
  landlord: ROUTES.LANDLORD_BILLING,
  owner: ROUTES.OWNER_BILLING,
  realtor: ROUTES.REALTOR_BILLING,
  estate: ROUTES.ESTATE_BILLING,
};

export interface SignedInPricingLinks {
  dashboard: string;
  billing?: string;
}

export function signedInPricingLinks(role: string | null | undefined): SignedInPricingLinks {
  const roleId = role || 'renter';
  const billing = BILLING_BY_ROLE[roleId];
  return billing
    ? { dashboard: getDashboardRoute(roleId), billing }
    : { dashboard: getDashboardRoute(roleId) };
}
