export interface StatementExplanation {
  headline: string;
  points: string[];
  questions: string[];
  flags: { code: string; severity: 'urgent' | 'soon' | 'info'; detail: string }[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
