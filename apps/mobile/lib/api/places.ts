import type { PlaceKind, PlaceSuggestion, VerifiedAddress } from '@sureground/shared';
import { apiFetch } from './client';

export const placesApi = {
  search: async (query: string, opts: { session: string; kind: PlaceKind }) => {
    const q = new URLSearchParams({ q: query, session: opts.session, kind: opts.kind });
    const data = await apiFetch<{ suggestions: PlaceSuggestion[] }>(`/geo/places/suggest?${q}`);
    return data.suggestions;
  },
  resolve: (placeId: string, session: string) =>
    apiFetch<VerifiedAddress>(
      `/geo/places/${encodeURIComponent(placeId)}?${new URLSearchParams({ session })}`
    ),
};
