/** Income is never stored. */
export interface Affordability {
  listingId: string;
  monthlyIncome: number | null;
  incomeSource: 'entered' | 'last_application' | null;
  band: 'comfortable' | 'stretched' | 'high' | 'unknown';
  verdict: string;
  rent: { amount: string; period: 'per month' | 'per year'; perYear: string };
  moveIn: { firstPayment: string; deposit: string | null; total: string };
  savingPlan: string | null;
  toAsk: string[];
}

export interface AffordabilityInput {
  monthlyIncome?: number;
  savings?: number;
  monthlySaving?: number;
}

export interface ComparedHome {
  listingId: string;
  label: string;
  title: string;
  area: string;
  rentPerYear: string;
  pricePosition: string;
  vsSimilar: string | null;
  moveInCash: string;
  listingCheck: 'looks_good' | 'check_carefully' | 'be_cautious';
  warnings: string[];
  affordability: string | null;
  standsOut: string;
}

export interface ShortlistComparison {
  overview: string;
  homes: ComparedHome[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
