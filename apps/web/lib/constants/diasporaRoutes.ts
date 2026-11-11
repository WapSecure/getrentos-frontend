// Sureground Diaspora Invest. One workspace, reachable from the buyer and the owner portals.
export type InvestorPortal = 'buyer' | 'owner';

export const DIASPORA_ROUTES = {
  PUBLIC: '/diaspora',
  BUYER_WORKSPACE: '/buyer/invest',
  BUYER_ONBOARDING: '/buyer/invest/onboarding',
  OWNER_WORKSPACE: '/owner/invest',
  OWNER_ONBOARDING: '/owner/invest/onboarding',
  workspace: (portal: InvestorPortal) => `/${portal}/invest`,
  onboarding: (portal: InvestorPortal) => `/${portal}/invest/onboarding`,
} as const;
