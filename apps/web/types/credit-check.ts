export type CreditScoreBand = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface CreditSummary {
  /** False for no credit file, common for first-time renters. */
  hasCreditFile: boolean;
  scoreBand: CreditScoreBand | null;
  score: number | null;
  activeLoans: number;
  delinquentAccounts: number;
  /** In naira. */
  totalOutstanding: number;
  bureaus: string[];
}

export interface SharedCreditCheck {
  provider: string;
  /** True when the figures are built-in sample data, not a bureau's. */
  isSample: boolean;
  sharedAt: string;
  expiresAt: string;
  summary: CreditSummary;
}
