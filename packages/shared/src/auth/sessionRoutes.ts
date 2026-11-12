// Which pages count as public is app-specific: the web app passes its own `isPublicPath`
// (apps/web/lib/sessionRoutes.ts).

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
