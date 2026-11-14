// " | Sureground" is appended by the root title template.
const TITLE_SUFFIX_LENGTH = ' | Sureground'.length;
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 155;

/** Cuts text at a word boundary so it fits `max`, adding an ellipsis only when something was cut. */
export function trimToWords(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,.;:–-]+$/, '')}…`;
}

/** A listing's page title: "Title: Location" when it fits, otherwise the title alone, trimmed. */
export function listingPageTitle(title: string, location: string): string {
  const room = MAX_TITLE_LENGTH - TITLE_SUFFIX_LENGTH;
  const full = location ? `${title}: ${location}` : title;
  if (full.length <= room) return full;
  return trimToWords(title, room);
}

export function metaDescription(text: string): string {
  return trimToWords(text, MAX_DESCRIPTION_LENGTH);
}
