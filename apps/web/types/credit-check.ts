export type CreditScoreBand = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface CreditSummary {
  /** False for a person with no credit file, which is common for first-time renters. */
  hasCreditFile: boolean;
  scoreBand: CreditScoreBand | null;
  score: number | null;
  activeLoans: number;
  delinquentAccounts: number;
  /** Still owed across active loans, in naira. */
  totalOutstanding: number;
  bureaus: string[];
}

/** A credit check the applicant chose to share with the landlord. */
export interface SharedCreditCheck {
  provider: string;
  /** True when the figures are built-in sample data, not a bureau's. */
  isSample: boolean;
  sharedAt: string;
  expiresAt: string;
  summary: CreditSummary;
}
