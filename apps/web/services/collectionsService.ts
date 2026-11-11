import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { CardMarket } from '@/lib/marketCards';
import type { ManagedCollection, PublicCollectionSummary } from '@/lib/collections';

export interface CollectionInput {
  title: string;
  description?: string | null;
  market?: CardMarket;
  startsAt?: string | null;
  endsAt?: string | null;
  coverListingId?: string | null;
}

export interface CollectionItemInput {
  listingId: string;
  note?: string;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== '') search.set(k, String(v));
  const s = search.toString();
  return s ? `?${s}` : '';
};

export const collectionsService = {
  listPublic(params: { market?: CardMarket; estate?: string; limit?: number }) {
    return safeCall(() => authFetch<PublicCollectionSummary[]>(`/collections${qs(params)}`));
  },
};

/**
 * The management API for one curator. `base` is where that curator's collections live:
 * `/estates/:estateId/collections`, `/agency/collections` or `/realtor/collections`.
 */
export function collectionsManager(base: string) {
  return {
    list(): Promise<ApiResponse<ManagedCollection[]>> {
      return safeCall(() => authFetch<ManagedCollection[]>(base));
    },
    get(id: string): Promise<ApiResponse<ManagedCollection>> {
      return safeCall(() => authFetch<ManagedCollection>(`${base}/${id}`));
    },
    create(input: CollectionInput): Promise<ApiResponse<ManagedCollection>> {
      return safeCall(() =>
        authFetch<ManagedCollection>(base, { method: 'POST', body: JSON.stringify(input) })
      );
    },
    update(id: string, input: Partial<CollectionInput>): Promise<ApiResponse<ManagedCollection>> {
      return safeCall(() =>
        authFetch<ManagedCollection>(`${base}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        })
      );
    },
    setItems(id: string, items: CollectionItemInput[]): Promise<ApiResponse<ManagedCollection>> {
      return safeCall(() =>
        authFetch<ManagedCollection>(`${base}/${id}/items`, {
          method: 'PUT',
          body: JSON.stringify({ items }),
        })
      );
    },
    publish(id: string): Promise<ApiResponse<ManagedCollection>> {
      return safeCall(() =>
        authFetch<ManagedCollection>(`${base}/${id}/publish`, { method: 'POST' })
      );
    },
    archive(id: string): Promise<ApiResponse<ManagedCollection>> {
      return safeCall(() =>
        authFetch<ManagedCollection>(`${base}/${id}/archive`, { method: 'POST' })
      );
    },
    candidates(market: CardMarket, search?: string): Promise<ApiResponse<unknown[]>> {
      return safeCall(() => authFetch<unknown[]>(`${base}/candidates${qs({ market, search })}`));
    },
  };
}

export type CollectionsManager = ReturnType<typeof collectionsManager>;
