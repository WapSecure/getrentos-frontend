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

export function parseHomeManagementTab(value: string | null | undefined): HomeManagementTab {
  return HOME_MANAGEMENT_TABS.find((tab) => tab === value) ?? DEFAULT_HOME_MANAGEMENT_TAB;
}

/** Keeps every other query parameter (the landlord hub's own `?tab=`, for one); the overview drops it. */
export function homeManagementTabHref(
  pathname: string,
  search: string,
  tab: HomeManagementTab,
  param = 'tab'
): string {
  const params = new URLSearchParams(search);
  if (tab === DEFAULT_HOME_MANAGEMENT_TAB) params.delete(param);
  else params.set(param, tab);
  if (tab !== 'utilities') params.delete(UTILITIES_VIEW_PARAM);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export const UTILITIES_VIEWS = ['power', 'water', 'service-charge', 'spend'] as const;

export type UtilitiesView = (typeof UTILITIES_VIEWS)[number];

export const DEFAULT_UTILITIES_VIEW: UtilitiesView = 'power';

export const UTILITIES_VIEW_PARAM = 'view';

export function parseUtilitiesView(value: string | null | undefined): UtilitiesView {
  return UTILITIES_VIEWS.find((view) => view === value) ?? DEFAULT_UTILITIES_VIEW;
}

export function utilitiesViewHref(pathname: string, search: string, view: UtilitiesView): string {
  const params = new URLSearchParams(search);
  if (view === DEFAULT_UTILITIES_VIEW) params.delete(UTILITIES_VIEW_PARAM);
  else params.set(UTILITIES_VIEW_PARAM, view);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export type UtilitiesCreateKind = 'fuel' | 'meter' | 'water-test';

export const UTILITIES_VIEW_FOR: Record<UtilitiesCreateKind, UtilitiesView> = {
  fuel: 'power',
  meter: 'power',
  'water-test': 'water',
};
