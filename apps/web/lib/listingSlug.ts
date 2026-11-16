// The trailing UUID identifies the listing; the words before it are cosmetic, so an edited title still resolves.

const UUID_TAIL = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const MAX_SLUG = 60;

export function slugify(text: string | null | undefined): string {
  const words = (text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (words.length <= MAX_SLUG) return words;
  const cut = words.slice(0, MAX_SLUG + 1);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 0 ? cut.slice(0, lastDash) : words.slice(0, MAX_SLUG)).replace(/-$/, '');
}

export function listingSegment(id: string, title?: string | null): string {
  const slug = slugify(title);
  return slug ? `${slug}-${id}` : id;
}

export function listingIdFromSegment(segment: string): string {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // Malformed escapes: fall back to the raw segment; the API will 404 it.
  }
  return decoded.match(UUID_TAIL)?.[1].toLowerCase() ?? decoded;
}

export type PublicListingKind = 'rent' | 'sale' | 'land' | 'shortlet';

export const LISTING_BASE: Record<PublicListingKind, string> = {
  rent: '/rent',
  sale: '/buy',
  land: '/land',
  shortlet: '/shortlets',
};

export const listingPath = (kind: PublicListingKind, id: string, title?: string | null): string =>
  `${LISTING_BASE[kind]}/${listingSegment(id, title)}`;
