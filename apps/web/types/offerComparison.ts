/** One live offer in a comparison, as the API returns it. */
export interface ComparedOffer {
  offerId: string;
  buyerName: string;
  label: string;
  /** "₦82,000,000, 4% below asking" */
  amount: string;
  pricePosition: string;
  originalAmount: string | null;
  /** Your own counter, waiting on the buyer. */
  yourCounter: string | null;
  /** Who moved last: "yours" means the seller can respond. */
  turn: 'yours' | 'buyer' | 'new';
  deposit: string | null;
  financing: string;
  financingNote: string;
  documents: string[];
  buyer: {
    verified: boolean;
    trustScore: number;
    completedPurchases: number;
    withdrawnOffersLastYear: number;
  };
  expiry: string;
  counterOption: { amount: string; basis: string } | null;
  standsOut: string;
  counterReasoning: string | null;
}

export interface ListingOfferComparison {
  listingId: string;
  property: string;
  asking: string;
  daysListed: number | null;
  market: string | null;
  /** Another offer was already accepted: these cannot be taken while that sale stands. */
  saleInProgress?: string | null;
  overview: string;
  offers: ComparedOffer[];
}

export interface OfferComparison {
  listings: ListingOfferComparison[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
