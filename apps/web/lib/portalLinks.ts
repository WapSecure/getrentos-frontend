/** An owner can't open /landlord, so these go to the owner portal. Mirrors OWNER_LANDLORD_LINKS in apps/mobile/lib/notificationRoutes.ts. */
const PORTAL_LINKS: Record<string, [from: string, to: string][]> = {
  owner: [
    ['/landlord/viewing-requests', '/owner/viewings?tab=renters'],
    ['/landlord/applications', '/owner/applications'],
    ['/landlord/leases', '/owner/leases'],
  ],
};

// Office replies carry an estate-side path; a resident who is also a renter or buyer sees them from that portal too.
const ANY_PORTAL_LINKS: [from: string, to: string][] = [
  ['/estate/office-messages', '/resident/messages'],
];

export function portalLink(portal: string, url: string): string {
  const q = url.indexOf('?');
  const path = q === -1 ? url : url.slice(0, q);
  const query = q === -1 ? '' : url.slice(q + 1);
  const match = [...(PORTAL_LINKS[portal] ?? []), ...ANY_PORTAL_LINKS].find(
    ([from]) => path === from || path === `${from}/`
  );
  if (!match) return url;
  if (!query) return match[1];
  return `${match[1]}${match[1].includes('?') ? '&' : '?'}${query}`;
}
