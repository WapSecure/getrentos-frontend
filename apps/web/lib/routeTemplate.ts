type RouteParams = Record<string, string | string[] | undefined>;

const SAFE_SEGMENT = /^[A-Za-z0-9_.-]{1,60}$/;
// Ids, phone numbers and anything else long and numeric never leave the page, even in a static-looking segment.
const ID_LIKE = /\d{5,}|^[0-9a-f]{8}-[0-9a-f]{4}-/i;

const decode = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/**
 * The route pattern of the current page (`/rent/[id]`), built from the path and the route's dynamic
 * params. Never the address bar: no query string, no ids, no slugs. Anything unexpected becomes `[id]`.
 */
export function routeTemplate(pathname: string, params: RouteParams | null | undefined): string {
  const names = new Map<string, string>();
  for (const [name, value] of Object.entries(params ?? {})) {
    if (typeof value === 'string') names.set(value, `[${name}]`);
    else if (Array.isArray(value)) for (const part of value) names.set(part, `[...${name}]`);
  }
  const out: string[] = [];
  for (const raw of pathname.split('?')[0].split('/').filter(Boolean)) {
    const segment = decode(raw);
    const named = names.get(segment);
    const next = named ?? (SAFE_SEGMENT.test(segment) && !ID_LIKE.test(segment) ? segment : '[id]');
    // A catch-all fills several segments; it is one segment of the pattern.
    if (next.startsWith('[...') && out[out.length - 1] === next) continue;
    out.push(next);
  }
  return `/${out.join('/')}`.slice(0, 120);
}
