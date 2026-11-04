/** The renter's lease guide, as the API returns it. */
export interface LeaseGuide {
  leaseId: string;
  summary: string[];
  renewalAdvice: string | null;
  termsToAsk: string[];
  counterOfferDraft: string | null;
  facts: {
    notices: { kind: string; served: string | null; expires: string | null; reason: string }[];
    renewal: {
      newRentPerYear: string;
      increasePercent: number;
      newEnd: string;
      landlordTerms: string | null;
    } | null;
    market: {
      similarHomes: number;
      median: string | null;
      typicalRange: { low: string; high: string } | null;
      renewalVsMedianPercent: number | null;
    };
  };
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
