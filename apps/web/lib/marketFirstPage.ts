// Server-safe (no client imports): the public market pages pre-render their first page with it,
// and the browsers import the page sizes so both sides ask for the same page.
import type { Paginated } from '@/lib/apiHelpers';
import { OPTIONAL_FETCH_TIMEOUT_MS, publicFetchInit } from '@/lib/publicFetch';
import { toQueryString } from '@/lib/publicListingMap';

export const SHORTLET_PAGE_SIZE = 9;
export const LAND_PAGE_SIZE = 9;

// Must match each browser's default sort, or the server-rendered page describes a different query.
export const shortletFirstPagePath = (): string =>
  `/shortlets${toQueryString({ page: 1, pageSize: SHORTLET_PAGE_SIZE, sort: 'newest' })}`;

export const landFirstPagePath = (): string =>
  `/land${toQueryString({ page: 1, pageSize: LAND_PAGE_SIZE, sort: 'newest' })}`;

/** Any query string at all; such views are noindex, matching each page's generateMetadata. */
export const isFilteredView = (params: Record<string, string | string[] | undefined>): boolean =>
  Object.values(params).some((value) => value !== undefined && value !== '');

/** The unfiltered first page, or null so the browser's own fetch takes over. */
export async function fetchFirstPage<Api, Item>(
  path: string,
  map: (item: Api) => Item
): Promise<Paginated<Item> | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // A slow API leaves the list to the browser rather than holding back the page.
    const res = await fetch(
      `${apiUrl}${path}`,
      publicFetchInit({ timeoutMs: OPTIONAL_FETCH_TIMEOUT_MS })
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Paginated<Api>;
    return { ...data, items: data.items.map(map) };
  } catch {
    return null;
  }
}
