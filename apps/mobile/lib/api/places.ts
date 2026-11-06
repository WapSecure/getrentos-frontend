import type { PlaceKind, PlaceSuggestion, VerifiedAddress } from '@getrentos/shared';
import { apiFetch } from './client';

/** Google address search through our API: suggestions while typing, then the checked address. */
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
