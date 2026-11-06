import {
  authFetch,
  safeCall,
  unwrap,
  type PlaceKind,
  type PlaceSuggestion,
  type VerifiedAddress,
} from '@/lib/apiHelpers';

/** Google address search through our API: suggestions while typing, then the checked address. */
export const placesService = {
  async search(
    query: string,
    opts: { session: string; kind: PlaceKind }
  ): Promise<PlaceSuggestion[]> {
    const q = new URLSearchParams({ q: query, session: opts.session, kind: opts.kind });
    const data = await unwrap(
      safeCall<{ suggestions: PlaceSuggestion[] }>(() => authFetch(`/geo/places/suggest?${q}`))
    );
    return data.suggestions;
  },

  resolve(placeId: string, session: string): Promise<VerifiedAddress> {
    const q = new URLSearchParams({ session });
    return unwrap(
      safeCall<VerifiedAddress>(() => authFetch(`/geo/places/${encodeURIComponent(placeId)}?${q}`))
    );
  },
};
