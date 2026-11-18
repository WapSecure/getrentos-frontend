export function sessionExpiredRedirect(
  location: { pathname: string; search: string },
  loginPath: string,
  isPublicPath?: (pathname: string) => boolean,
  reason: 'expired' | 'ended' = 'expired'
): string | null {
  const { pathname, search } = location;
  if (pathname.startsWith(loginPath)) return null;
  if (isPublicPath?.(pathname)) return null;
  const from = `${pathname}${search}`;
  return `${loginPath}?reason=${reason === 'ended' ? 'session_ended' : 'session_expired'}&next=${encodeURIComponent(from)}`;
}
