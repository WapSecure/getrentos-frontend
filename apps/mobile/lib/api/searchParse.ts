import { apiFetch } from './client';
import type { ListingFilters, PropertyType } from './properties';

export interface RentalSearchParse {
  filters: {
    location?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    verifiedOnly?: boolean;
    sortBy?: string;
  };
  notes: string[];
  summary: string;
  source: 'ai' | 'heuristic';
}

export const searchParseApi = {
  parse: (query: string) =>
    apiFetch<RentalSearchParse>('/renter/listings/search/parse', {
      method: 'POST',
      body: { query },
    }),
};

/** A sentence ("2 bed in Yaba under 2m") is parsed; a word or two stays a plain text search. */
export const looksLikeSentence = (text: string) => text.trim().split(/\s+/).length >= 3;

export function toListingFilters(r: RentalSearchParse, known: readonly string[]): ListingFilters {
  const f = r.filters;
  return {
    location: f.location ?? f.state,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    bedrooms: f.bedrooms,
    bathrooms: f.bathrooms,
    propertyType:
      f.propertyType && known.includes(f.propertyType)
        ? (f.propertyType as PropertyType)
        : undefined,
    verifiedOnly: f.verifiedOnly || undefined,
  };
}
