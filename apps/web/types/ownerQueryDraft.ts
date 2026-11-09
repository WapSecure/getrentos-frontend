export interface OwnerQueryDraft {
  queryId: string;
  reply: string;
  /** To confirm before sending. */
  toCheck: string[];
  facts: { title: string; lines: string[] }[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
