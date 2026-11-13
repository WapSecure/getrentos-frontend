import appLinks from '@sureground/shared/constants/app-links.json';
import type { MarketKind } from './api/publicMarket';
import { routeForActionUrl } from './notificationRoutes';

export type LinkTarget =
  | { route: string; listing?: { kind: MarketKind; id: string } }
  | { web: string };

const LISTING_SECTIONS: Record<string, MarketKind> = {
  rent: 'rent',
  buy: 'sale',
  shortlets: 'shortlet',
  land: 'land',
};

const startsWithSegment = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

const isClaimed = (path: string) => appLinks.claimed.some((p) => startsWithSegment(path, p));

function splitUrl(url: string): { path: string; query: string } {
  // An app-scheme URL (sureground://magic-link) has no host, so what follows the scheme is already the path.
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

  // The magic-link hook reads the token from the raw URL; the app only needs to land where the root router takes over.
  if (startsWithSegment(path, '/magic-link')) return { route: '/' };

  if (!isClaimed(path)) return null;

  if (appLinks.webOnly.some((p) => startsWithSegment(path, p))) {
    return { web: `${webUrl}${path}${query ? `?${query}` : ''}` };
  }

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
  // The representative's desk also lives at the top level on the website.
  if (section === 'representing') {
    if (first === 'transactions' && second)
      return { route: `/(app)/land-represented?kind=transaction&id=${id(second)}` };
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

  if ((section === 'l' || section === 'e') && first && !second) {
    return { route: `/(public)/${section === 'l' ? 'landlord' : 'estate'}/${id(first)}` };
  }

  const publicPage = kind || ['estates', 'l', 'e'].includes(section);
  return publicPage ? { web: `${webUrl}${path}` } : { route: '/' };
}
