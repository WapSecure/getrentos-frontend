// Sign-in redirect only on these areas; keep in step with the guarded layouts under app/ and robots.ts.
const SIGNED_IN_SECTIONS = [
  '/agency',
  '/agent',
  '/buyer',
  '/estate',
  '/gateman',
  '/landlord',
  '/owner',
  '/realtor',
  '/renter',
  '/resident',
  '/dashboard',
  '/admin',
  '/role-selection',
  '/agency-invite',
  '/billing',
  '/boosts',
  '/payments',
  '/representing',
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

export function isSignedInWebPath(pathname: string): boolean {
  let path = pathname;
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (SIGNED_IN_SECTIONS.some((section) => isWithin(path, section))) return true;
  const land = /^\/land\/([^/]+)/.exec(path);
  return Boolean(land && SIGNED_IN_LAND_PAGES.has(land[1]!));
}

export const isPublicWebPath = (pathname: string) => !isSignedInWebPath(pathname);
