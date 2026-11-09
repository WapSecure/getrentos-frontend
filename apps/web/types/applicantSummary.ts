/** Never a ranking or decision. */
export interface ApplicantSummary {
  applicationId: string;
  summary: string;
  questions: string[];
  checks: string[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
