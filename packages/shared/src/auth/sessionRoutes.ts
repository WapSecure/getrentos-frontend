// Public web pages that work signed out. An ended session on one of these is dropped quietly;
// anywhere else (dashboards and other signed-in areas) it sends the visitor to sign in.
const PUBLIC_WEB_SECTIONS = [
  '/rent',
  '/buy',
  '/shortlets',
  '/collections',
  '/l',
  '/e',
  '/estates',
  '/pricing',
  '/privacy',
  '/terms',
  '/cookies',
  '/diaspora',
  '/detty-december',
  '/home-management',
  '/land/market',
  '/land/layouts',
  '/developments',
];

// `/land/<id>` is a public listing, but these `/land/*` pages are signed-in workspaces.
const SIGNED_IN_LAND_PAGES = new Set([
  'consents',
  'disputes',
  'dossier',
  'inspections',
  'representing',
  'reviews',
  'watch',
]);

const isWithin = (pathname: string, section: string) =>
  pathname === section || pathname.startsWith(`${section}/`);

export function isPublicWebPath(pathname: string): boolean {
  let path = pathname;
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (path === '/' || path === '/land') return true;
  if (PUBLIC_WEB_SECTIONS.some((section) => isWithin(path, section))) return true;
  const land = /^\/land\/([^/]+)$/.exec(path);
  return Boolean(land && !SIGNED_IN_LAND_PAGES.has(land[1]!));
}

/**
 * Where to send the visitor once their session has ended, or null to stay on the page.
 * Public pages stay put (the stale session is simply dropped), as does the sign-in page itself.
 */
export function sessionExpiredRedirect(
  location: { pathname: string; search: string },
  loginPath: string,
  isPublicPath?: (pathname: string) => boolean
): string | null {
  const { pathname, search } = location;
  if (pathname.startsWith(loginPath)) return null;
  if (isPublicPath?.(pathname)) return null;
  const from = `${pathname}${search}`;
  return `${loginPath}?reason=session_expired&next=${encodeURIComponent(from)}`;
}
