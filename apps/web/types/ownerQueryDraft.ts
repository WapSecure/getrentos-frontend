/** POST /owner-queries/:id/draft-reply: a drafted reply the manager edits and sends. */
export interface OwnerQueryDraft {
  queryId: string;
  reply: string;
  /** Points the records do not settle, to confirm before sending. */
  toCheck: string[];
  /** The records the draft was written from, worded by Sureground. */
  facts: { title: string; lines: string[] }[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
