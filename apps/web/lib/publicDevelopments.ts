// Server-safe (no client imports). Both routes are `@Public()` and return live developments only.
import {
  developmentOf,
  developmentSummaryOf,
  type ShowroomDevelopment,
  type ShowroomDevelopmentSummary,
} from '@sureground/shared/showroom';
import { publicFetchInit } from '@/lib/publicFetch';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const DEVELOPMENTS_PATH = '/developments';
export const developmentPath = (id: string) => `${DEVELOPMENTS_PATH}/${encodeURIComponent(id)}`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function get(path: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, publicFetchInit());
  } catch (cause) {
    // Unreachable API: the error boundary offers a retry, rather than a 404 telling search engines it is gone.
    throw new Error(`Public development request failed: ${path}`, { cause });
  }
  if (res.status >= 400 && res.status < 500) return null;
  if (!res.ok) throw new Error(`Public development request failed (${res.status}): ${path}`);
  return res.json();
}

/** Null when it is not live (or the id is not one). */
export async function fetchPublicDevelopment(id: string): Promise<ShowroomDevelopment | null> {
  if (!UUID.test(id)) return null;
  return developmentOf(await get(`/developments/${encodeURIComponent(id)}`)) ?? null;
}

export async function fetchPublicDevelopments(query: {
  state?: string;
  page?: number;
}): Promise<{
  items: ShowroomDevelopmentSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const params = new URLSearchParams({ pageSize: '12', page: String(query.page ?? 1) });
  if (query.state) params.set('state', query.state);
  const raw = (await get(`/developments?${params}`)) as {
    items?: unknown[];
    total?: number;
    page?: number;
    totalPages?: number;
  } | null;
  const items = (raw?.items ?? [])
    .map(developmentSummaryOf)
    .filter((d): d is ShowroomDevelopmentSummary => !!d);
  return {
    items,
    total: typeof raw?.total === 'number' ? raw.total : items.length,
    page: typeof raw?.page === 'number' ? raw.page : 1,
    totalPages: typeof raw?.totalPages === 'number' ? raw.totalPages : 1,
  };
}
