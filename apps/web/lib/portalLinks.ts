/**
 * Landlord-portal links the backend sends to anyone who controls a property (landlord, owner,
 * manager). An owner without the landlord role can't open /landlord, so these go to the owner
 * portal's equivalent page. Mirrors OWNER_LANDLORD_LINKS in apps/mobile/lib/notificationRoutes.ts.
 */
const PORTAL_LINKS: Record<string, [from: string, to: string][]> = {
  owner: [['/landlord/viewing-requests', '/owner/viewings?tab=renters']],
};

/** Rewrites an in-app link for the portal the user is in; any query string is kept. */
export function portalLink(portal: string, url: string): string {
  const q = url.indexOf('?');
  const path = q === -1 ? url : url.slice(0, q);
  const query = q === -1 ? '' : url.slice(q + 1);
  const match = (PORTAL_LINKS[portal] ?? []).find(([from]) => path === from || path === `${from}/`);
  if (!match) return url;
  if (!query) return match[1];
  return `${match[1]}${match[1].includes('?') ? '&' : '?'}${query}`;
}
