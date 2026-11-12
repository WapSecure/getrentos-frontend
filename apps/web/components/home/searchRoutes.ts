export type SearchKind = 'buy' | 'rent' | 'stays' | 'land';

const BASE: Record<SearchKind, string> = {
  buy: '/buy',
  rent: '/rent',
  stays: '/shortlets',
  land: '/land',
};

/** Every marketplace browser reads the free-text area search from `q`. */
export function searchHref(kind: SearchKind, query: string): string {
  const q = query.trim();
  return q ? `${BASE[kind]}?q=${encodeURIComponent(q)}` : BASE[kind];
}
