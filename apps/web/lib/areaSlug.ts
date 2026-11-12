/** URL slug for an area name: "Lekki Phase 1" → "lekki-phase-1", "Wuse 2" → "wuse-2". */
export function areaSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The entry whose name slugs to `slug`, if any. */
export function findBySlug<T extends { name: string }>(
  items: readonly T[],
  slug: string
): T | undefined {
  return items.find((item) => areaSlug(item.name) === slug);
}
