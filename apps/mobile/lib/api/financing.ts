import { apiFetch } from './client';

/** Mirrors the backend's `MIN_TRUST_SCORE_FOR_FINANCING` — not returned by the API, so kept in sync here. */
export const MIN_TRUST_SCORE_FOR_FINANCING = 65;

export type FinancingPlanLength = 3 | 6 | 12;

/** Mirrors the backend's `FEE_SCHEDULE` — not returned by the API, so kept in sync here. */
export const FINANCING_FEE_SCHEDULE: Record<FinancingPlanLength, number> = {
  3: 6,
  6: 9,
  12: 14,
};

export type FinancingInstallmentStatus = 'upcoming' | 'due' | 'processing' | 'paid' | 'overdue';

export interface FinancingInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: FinancingInstallmentStatus;
  paidDate?: string;
}

export interface FinancingPlan {
  id: string;
  propertyName: string;
  landlordName: string;
  rentAmount: number;
  planLengthMonths: FinancingPlanLength;
  feePercent: number;
  feeAmount: number;
  totalRepayable: number;
  monthlyInstallment: number;
  status: 'active' | 'completed' | 'defaulted' | 'rejected';
  appliedAt: string;
  landlordPaidAt?: string;
  installments: FinancingInstallment[];
  authorizationUrl?: string;
  reference?: string;
}

export interface FinancingOverview {
  rentAmount: number;
  trustScore: number;
  propertyName: string;
  landlordName: string;
  applicationStatus: 'not_applied' | 'pending_review' | 'approved' | 'rejected';
  plan?: FinancingPlan;
}

export const financingApi = {
  getOverview: () => apiFetch<FinancingOverview>('/renter/financing'),

  apply: (months: FinancingPlanLength) =>
    apiFetch<FinancingPlan>('/renter/financing/apply', { method: 'POST', body: { months } }),

  payInstallment: (id: string) =>
    apiFetch<FinancingPlan>(`/renter/financing/installments/${id}/pay`, { method: 'POST' }),
};
