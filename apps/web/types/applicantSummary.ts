/** An applicant's screening facts in plain words, as the API returns it. Never a ranking or decision. */
export interface ApplicantSummary {
  applicationId: string;
  summary: string;
  /** Questions the landlord could ask the applicant about gaps in the facts. */
  questions: string[];
  /** Checks the landlord could make before deciding. */
  checks: string[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
