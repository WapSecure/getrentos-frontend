/** Tabs on /owner/viewings: renters (rental viewing requests) and buyers (sale viewings). */
export const OWNER_VIEWING_TABS = ['renters', 'buyers'] as const;

export type OwnerViewingTab = (typeof OWNER_VIEWING_TABS)[number];

/** Buyers stays the default so the Selling nav link lands where it always did. */
export const ownerViewingTab = (value: string | null | undefined): OwnerViewingTab =>
  value === 'renters' ? 'renters' : 'buyers';
