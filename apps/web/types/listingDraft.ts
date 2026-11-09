export interface ListingPriceGuide {
  similarHomes: number;
  typicalPerYear: string | null;
  typicalRange: { low: string; high: string } | null;
}

export interface ListingDraft {
  title: string;
  amenities: { name: string; why: string }[];
  descriptionSuggestion: string | null;
  price: ListingPriceGuide;
  photosUsed: number;
  source: 'ai' | 'heuristic';
}

export interface ListingSelfCheckInput {
  unitId: string;
  listingTitle: string;
  askingRent: number;
  rentPeriod: 'year' | 'month';
}

export interface ListingSelfCheck {
  items: { key: string; level: 'fix' | 'consider'; message: string }[];
  price: ListingPriceGuide & { vsTypicalPercent: number | null };
}
