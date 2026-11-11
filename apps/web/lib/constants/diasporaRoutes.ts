// Sureground Diaspora Invest. One workspace, reachable from the buyer and the owner portals.
export type InvestorPortal = 'buyer' | 'owner';

export const DIASPORA_ROUTES = {
  PUBLIC: '/diaspora',
  BUYER_WORKSPACE: '/buyer/invest',
  BUYER_ONBOARDING: '/buyer/invest/onboarding',
  OWNER_WORKSPACE: '/owner/invest',
  OWNER_ONBOARDING: '/owner/invest/onboarding',
  /** Sureground Managed in one place (owner portal only: managed property belongs to owners). */
  OWNER_MANAGED: '/owner/invest/managed',
  workspace: (portal: InvestorPortal) => `/${portal}/invest`,
  onboarding: (portal: InvestorPortal) => `/${portal}/invest/onboarding`,
} as const;
