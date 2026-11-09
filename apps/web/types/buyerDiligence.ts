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
  questions: string[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
