// " | Sureground" is appended by the root title template.
const TITLE_SUFFIX_LENGTH = ' | Sureground'.length;
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 155;

export function trimToWords(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,.;:–-]+$/, '')}…`;
}

export function listingPageTitle(title: string, location: string): string {
  const room = MAX_TITLE_LENGTH - TITLE_SUFFIX_LENGTH;
  const full = location ? `${title}: ${location}` : title;
  if (full.length <= room) return full;
  return trimToWords(title, room);
}

export function metaDescription(text: string): string {
  return trimToWords(text, MAX_DESCRIPTION_LENGTH);
}
