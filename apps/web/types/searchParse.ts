/** Discover filters read from a plain-language search. Prices are yearly naira. */
export interface RentalSearchFilters {
  location?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  verifiedOnly?: boolean;
  furnished?: boolean;
  petsAllowed?: boolean;
  monthlyPayment?: boolean;
  sortBy?: string;
}

export interface RentalSearchParse {
  filters: RentalSearchFilters;
  notes: string[];
  summary: string;
  source: 'ai' | 'heuristic';
}
