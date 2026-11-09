/** Kept apart from the network client so tests that mock the client still get the real builder. */

/** Arrays are sent comma-separated. */
export type QueryValue = string | number | boolean | null | undefined | readonly string[];

/** Leaves out undefined, null, '', an empty array and `false` (an unticked filter means "don't filter"). */
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
