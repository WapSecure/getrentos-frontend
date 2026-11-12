import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';
import type {
  CardMarket,
  CollectionInput,
  CollectionRule,
  CollectionRulePreview,
  ManagedCollection,
  SponsorshipInput,
} from '@/types/collections';

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
  candidates(
    market: CardMarket,
    search?: string,
    collectionId?: string
  ): Promise<ApiResponse<unknown[]>> {
    return safeCall(() =>
      authFetch<unknown[]>(`${BASE}/candidates${qs({ market, search, collectionId })}`)
    );
  },
  previewRule(
    market: CardMarket,
    rule: CollectionRule,
    collectionId?: string
  ): Promise<ApiResponse<CollectionRulePreview>> {
    return safeCall(() =>
      authFetch<CollectionRulePreview>(`${BASE}/rule-preview`, {
        method: 'POST',
        body: JSON.stringify({ market, rule, collectionId }),
      })
    );
  },
  /** Step-up is asked for by the API and handled by the StepUpDialog. */
  setSponsorship(id: string, input: SponsorshipInput): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() =>
      authFetch<ManagedCollection>(`${BASE}/${id}/sponsorship`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  },
  removeSponsorship(id: string): Promise<ApiResponse<ManagedCollection>> {
    return safeCall(() =>
      authFetch<ManagedCollection>(`${BASE}/${id}/sponsorship`, { method: 'DELETE' })
    );
  },
};

export type CollectionsManager = typeof adminCollectionsService;
