import appLinks from '@getrentos/shared/constants/app-links.json';
import type { MarketKind } from './api/publicMarket';
import { routeForActionUrl } from './notificationRoutes';

/**
 * Where a tapped link should open in the app.
 *
 * Website links (universal links on iOS, app links on Android) arrive with the
 * website's paths: /rent/123, /landlord/payments, /magic-link/verify?token=…
 * The app's own routes are named differently, so each claimed path is mapped
 * here. Dashboard pages reuse the notification mapping (one table for both).
 *
 * - `route`: open this app route.
 * - `listing`: also remember the listing, so a signed-in person lands on it in
 *   the workspace that can act on it (see lib/pendingListing).
 * - `web`: a page the app has no screen for; open it in the browser instead.
 * - null: not a website path; leave the link to the router unchanged.
 */
export type LinkTarget =
  | { route: string; listing?: { kind: MarketKind; id: string } }
  | { web: string };

/** Website listing sections and the market each one is. */
const LISTING_SECTIONS: Record<string, MarketKind> = {
  rent: 'rent',
  buy: 'sale',
  shortlets: 'shortlet',
  land: 'land',
};

const startsWithSegment = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

const isClaimed = (path: string) => appLinks.claimed.some((p) => startsWithSegment(path, p));

/** `/a/b?x=1#y` from any incoming URL or path, without a trailing slash. */
function splitUrl(url: string): { path: string; query: string } {
  // A website URL drops its origin; an app-scheme URL (getrentos://magic-link)
  // has no host, so what follows the scheme is already the path.
  const withoutOrigin = url
    .replace(/^https?:\/\/[^/?#]*/i, '')
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const [beforeHash] = withoutOrigin.split('#');
  const [rawPath, query = ''] = beforeHash.split('?');
  const path = `/${rawPath.replace(/^\/+/, '')}`.replace(/\/+$/, '') || '/';
  return { path, query };
}

export function resolveIncomingLink(url: string, webUrl: string): LinkTarget | null {
  const { path, query } = splitUrl(url);

  // A sign-in link: the magic-link hook reads the token from the raw URL, so
  // the app only needs to land somewhere the root router can take over from.
  if (startsWithSegment(path, '/magic-link')) return { route: '/' };

  if (!isClaimed(path)) return null;

  if (appLinks.webOnly.some((p) => startsWithSegment(path, p))) {
    return { web: `${webUrl}${path}${query ? `?${query}` : ''}` };
  }

  // Dashboard pages that have a screen (also /land/consents, /land/watch, …).
  const dashboard = routeForActionUrl(path);
  if (dashboard) return { route: dashboard };

  const [section, first, second, third] = path.split('/').filter(Boolean);
  const raw = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const id = (s: string) => encodeURIComponent(raw(s));

  if (section === 'land' && first === 'layouts') {
    return { route: second ? `/(app)/land-estate/${id(second)}` : '/(app)/land-estates' };
  }
  if (section === 'land' && first === 'representing') {
    if (second === 'purchases' && third)
      return { route: `/(app)/land-represented?kind=purchase&id=${id(third)}` };
    if (second === 'transactions' && third)
      return { route: `/(app)/land-represented?kind=transaction&id=${id(third)}` };
    return { route: '/(app)/land-representing' };
  }

  const kind = LISTING_SECTIONS[section];
  if (kind) {
    if (!first) return { route: `/(market)?kind=${kind}` };
    if (!second) {
      return {
        route: `/(market)/listing/${kind}/${id(first)}`,
        listing: { kind, id: raw(first) },
      };
    }
  }
  if (section === 'estates' && !first) return { route: '/(market)?kind=estates' };

  // A claimed page the app has no screen for. A public page is better shown on
  // the website; a dashboard page opens the person's home in the app.
  return kind || section === 'estates' ? { web: `${webUrl}${path}` } : { route: '/' };
}
