'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type UrlValue = string | number | boolean | null | undefined;

/** How a value is written: empty, false and the default are left out, so links stay short and stable. */
export const serialise = (value: UrlValue): string | undefined => {
  if (value === undefined || value === null || value === false || value === '') return undefined;
  return value === true ? '1' : String(value);
};

/**
 * Mirrors browse state into the query string (replace, no scroll), so a view can be shared or
 * reloaded as it was. Keys not passed here, such as `estate`, are left alone.
 */
export function useSyncUrlState(
  state: Record<string, UrlValue>,
  defaults: Record<string, UrlValue> = {}
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.toString();

  // Cheap to rebuild each render; the effect only navigates when the text actually differs.
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(state)) {
    const text = serialise(value);
    if (text === undefined || text === serialise(defaults[key])) params.delete(key);
    else params.set(key, text);
  }
  const next = params.toString();

  useEffect(() => {
    if (next !== current)
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [next, current, pathname, router]);
}

/** Readers for the first render; state then lives in React and is mirrored back by useSyncUrlState. */
export const urlParam = {
  text: (params: URLSearchParams, key: string, fallback = '') =>
    params.get(key)?.trim() || fallback,
  flag: (params: URLSearchParams, key: string) =>
    params.get(key) === '1' || params.get(key) === 'true',
  page: (params: URLSearchParams, key = 'page') => {
    const n = Number(params.get(key));
    return Number.isInteger(n) && n > 0 ? n : 1;
  },
  oneOf: <T extends string>(
    params: URLSearchParams,
    key: string,
    options: readonly T[],
    fallback: T
  ): T => {
    const value = params.get(key);
    return options.includes(value as T) ? (value as T) : fallback;
  },
  list: (params: URLSearchParams, key: string) =>
    (params.get(key) ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
};
