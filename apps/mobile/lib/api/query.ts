/**
 * Query strings for API paths. Kept apart from the network client so it stays
 * pure: tests that mock the client still get the real builder.
 */

/** A value a query string can carry; arrays are sent comma-separated. */
export type QueryValue = string | number | boolean | null | undefined | readonly string[];

/**
 * `?a=1&b=x` from a params object, or '' when nothing is set. Empty values are
 * left out: undefined, null, '', an empty array, and `false` (an unticked
 * filter means "don't filter"). The one query builder for every API module.
 */
export function toQuery(params: Record<string, QueryValue>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    if (Array.isArray(v)) {
      if (v.length) q.set(k, v.join(','));
      continue;
    }
    q.set(k, String(v));
  }
  const out = q.toString();
  return out ? `?${out}` : '';
}
