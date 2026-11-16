export const OWNER_VIEWING_TABS = ['renters', 'buyers'] as const;

export type OwnerViewingTab = (typeof OWNER_VIEWING_TABS)[number];

export const ownerViewingTab = (value: string | null | undefined): OwnerViewingTab =>
  value === 'renters' ? 'renters' : 'buyers';
