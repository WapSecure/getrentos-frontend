import { authFetch, safeCall, toQuery, type ApiResponse } from '@sureground/shared';
import type { Paginated } from './adminService';

export type RiskEvent = 'SIGN_IN' | 'PAYOUT_REQUEST' | 'STEP_UP_FAILURES';
export type RiskReviewStatus = 'OPEN' | 'RELEASED' | 'CONFIRMED';

export interface RiskSignal {
  rule: string;
  outcome: string;
  reason: string;
}

export interface RiskDecision {
  id: string;
  createdAt: string;
  event: RiskEvent;
  outcome: string;
  enforced: boolean;
  policyVersion: string;
  signals: RiskSignal[];
  deviceLabel: string | null;
  subjectType: string | null;
  user: { id: string; name: string; email: string | null };
  review: {
    status: RiskReviewStatus;
    note: string | null;
    reviewedAt: string | null;
    appealNote: string | null;
    appealedAt: string | null;
  } | null;
}

export interface RiskRuleSummary {
  rule: string;
  event: RiskEvent;
  wouldBe: string;
  count: number;
  enforced: boolean;
}

export interface RiskSummary {
  policyVersion: string;
  days: number;
  rules: RiskRuleSummary[];
}

export const adminRiskService = {
  list(params: {
    event?: RiskEvent;
    flaggedOnly?: boolean;
    reviewStatus?: RiskReviewStatus;
    page: number;
    pageSize: number;
  }): Promise<ApiResponse<Paginated<RiskDecision>>> {
    const query = toQuery({
      event: params.event,
      flaggedOnly: params.flaggedOnly === false ? 'false' : undefined,
      reviewStatus: params.reviewStatus,
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    });
    return safeCall(() => authFetch<Paginated<RiskDecision>>(`/admin/risk-decisions${query}`));
  },
  /** Asks the officer to confirm it's them (step-up) before money is released or a fraud alert opened. */
  review(
    id: string,
    action: 'release' | 'confirm',
    note: string
  ): Promise<ApiResponse<{ status: RiskReviewStatus; fraudAlertId?: string }>> {
    return safeCall(() =>
      authFetch(`/admin/risk-decisions/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    );
  },
  summary(): Promise<ApiResponse<RiskSummary>> {
    return safeCall(() => authFetch<RiskSummary>('/admin/risk-decisions/summary'));
  },
};
