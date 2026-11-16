export type InvestorPortal = 'buyer' | 'owner';

export const DIASPORA_ROUTES = {
  PUBLIC: '/diaspora',
  TRANSPARENCY: '/diaspora/transparency',
  BUYER_WORKSPACE: '/buyer/invest',
  BUYER_ONBOARDING: '/buyer/invest/onboarding',
  OWNER_WORKSPACE: '/owner/invest',
  OWNER_ONBOARDING: '/owner/invest/onboarding',
  OWNER_MANAGED: '/owner/invest/managed',
  managedStatement: (statementId: string) =>
    `/owner/invest/managed?statement=${encodeURIComponent(statementId)}`,
  BUYER_IDENTITY_ABROAD: '/buyer/trust-profile?tab=abroad',
  workspace: (portal: InvestorPortal) => `/${portal}/invest`,
  onboarding: (portal: InvestorPortal) => `/${portal}/invest/onboarding`,
} as const;
