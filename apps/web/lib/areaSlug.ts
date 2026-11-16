export function areaSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findBySlug<T extends { name: string }>(
  items: readonly T[],
  slug: string
): T | undefined {
  return items.find((item) => areaSlug(item.name) === slug);
}
