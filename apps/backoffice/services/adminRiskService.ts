import { authFetch, safeCall, toQuery, type ApiResponse } from '@sureground/shared';
import type { Paginated } from './adminService';

export type RiskEvent = 'SIGN_IN' | 'PAYOUT_REQUEST';

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
    page: number;
    pageSize: number;
  }): Promise<ApiResponse<Paginated<RiskDecision>>> {
    const query = toQuery({
      event: params.event,
      flaggedOnly: params.flaggedOnly === false ? 'false' : undefined,
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    });
    return safeCall(() => authFetch<Paginated<RiskDecision>>(`/admin/risk-decisions${query}`));
  },
  summary(): Promise<ApiResponse<RiskSummary>> {
    return safeCall(() => authFetch<RiskSummary>('/admin/risk-decisions/summary'));
  },
};
