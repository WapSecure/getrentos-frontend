export const HOME_MANAGEMENT_TABS = [
  'overview',
  'work-orders',
  'preventive-care',
  'assets',
  'utilities',
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
  // The Utilities sub-view (power, water, spend) means nothing on another tab.
  if (tab !== 'utilities') params.delete(UTILITIES_VIEW_PARAM);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** The Utilities tab's own sub-view, kept in `view`. Power is the default. */
export const UTILITIES_VIEWS = ['power', 'water', 'spend'] as const;

export type UtilitiesView = (typeof UTILITIES_VIEWS)[number];

export const DEFAULT_UTILITIES_VIEW: UtilitiesView = 'power';

export const UTILITIES_VIEW_PARAM = 'view';

/** An unknown value falls back to power, so an old link still opens the tab. */
export function parseUtilitiesView(value: string | null | undefined): UtilitiesView {
  return UTILITIES_VIEWS.find((view) => view === value) ?? DEFAULT_UTILITIES_VIEW;
}

/** The URL for a utilities sub-view, keeping every other parameter; power drops the parameter. */
export function utilitiesViewHref(pathname: string, search: string, view: UtilitiesView): string {
  const params = new URLSearchParams(search);
  if (view === DEFAULT_UTILITIES_VIEW) params.delete(UTILITIES_VIEW_PARAM);
  else params.set(UTILITIES_VIEW_PARAM, view);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** The workspace's "Add" actions that open a utilities form, and the sub-view each one needs. */
export type UtilitiesCreateKind = 'fuel' | 'meter' | 'water-test';

export const UTILITIES_VIEW_FOR: Record<UtilitiesCreateKind, UtilitiesView> = {
  fuel: 'power',
  meter: 'power',
  'water-test': 'water',
};
