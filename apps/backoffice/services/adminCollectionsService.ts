import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';
import type { CardMarket, CollectionInput, ManagedCollection } from '@/types/collections';

const BASE = '/admin/collections';

const qs = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
  const s = search.toString();
  return s ? `?${s}` : '';
};

/** Staff curation across owners; the backend requires collections.manage on every route. */
export const adminCollectionsService = {
  list(): Promise<ApiResponse<ManagedCollection[]>> {
    return safeCall(() => authFetch<ManagedCollection[]>(BASE));
  },
  get(id: string): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() => authFetch<ManagedCollection>(`${BASE}/${id}`));
  },
  create(input: CollectionInput): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() =>
      authFetch<ManagedCollection>(BASE, { method: 'POST', body: JSON.stringify(input) })
    );
  },
  update(id: string, input: Partial<CollectionInput>): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() =>
      authFetch<ManagedCollection>(`${BASE}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    );
  },
  setItems(
    id: string,
    items: Array<{ listingId: string; note?: string }>
  ): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() =>
      authFetch<ManagedCollection>(`${BASE}/${id}/items`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      })
    );
  },
  publish(id: string): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() =>
      authFetch<ManagedCollection>(`${BASE}/${id}/publish`, { method: 'POST' })
    );
  },
  archive(id: string): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() =>
      authFetch<ManagedCollection>(`${BASE}/${id}/archive`, { method: 'POST' })
    );
  },
  candidates(market: CardMarket, search?: string): Promise<ApiResponse<unknown[]>> {
    return safeCall(() => authFetch<unknown[]>(`${BASE}/candidates${qs({ market, search })}`));
  },
};

export type CollectionsManager = typeof adminCollectionsService;
