/** GET /buyer/listings/:id/diligence: due diligence on a property for sale, from what is on file. */
export interface BuyerDiligence {
  listingId: string;
  price: { asking: string; vsSimilar: string | null };
  items: {
    key: string;
    title: string;
    status: 'done' | 'in_progress' | 'to_do' | 'concern';
    finding: string;
    why: string;
  }[];
  summary: string;
  /** Questions to ask the seller. */
  questions: string[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
