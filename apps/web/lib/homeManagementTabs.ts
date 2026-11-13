export const HOME_MANAGEMENT_TABS = [
  'overview',
  'work-orders',
  'preventive-care',
  'assets',
  'service-standards',
  'history',
] as const;

export type HomeManagementTab = (typeof HOME_MANAGEMENT_TABS)[number];

export const DEFAULT_HOME_MANAGEMENT_TAB: HomeManagementTab = 'overview';

/** An unknown or missing value falls back to the overview, so an old or mistyped link still opens the page. */
export function parseHomeManagementTab(value: string | null | undefined): HomeManagementTab {
  return HOME_MANAGEMENT_TABS.find((tab) => tab === value) ?? DEFAULT_HOME_MANAGEMENT_TAB;
}

/**
 * The URL for a tab, keeping every other query parameter (the landlord hub's own `?tab=`, for one).
 * The overview is the default, so it drops the parameter rather than writing it.
 */
export function homeManagementTabHref(
  pathname: string,
  search: string,
  tab: HomeManagementTab,
  param = 'tab'
): string {
  const params = new URLSearchParams(search);
  if (tab === DEFAULT_HOME_MANAGEMENT_TAB) params.delete(param);
  else params.set(param, tab);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
