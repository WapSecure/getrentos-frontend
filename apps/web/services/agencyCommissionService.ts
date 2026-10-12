import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AgencyCommissionType = 'LETTING' | 'RENEWAL';

export const AGENCY_COMMISSION_TYPE_LABELS: Record<AgencyCommissionType, string> = {
  LETTING: 'Letting',
  RENEWAL: 'Renewal',
};

export interface AgencyCommission {
  id: string;
  type: AgencyCommissionType;
  ownerName: string | null;
  propertyTitle: string | null;
  baseAmount: number;
  ratePct: number;
  amount: number;
  status: string;
  earnedAt: string;
  attributedUserId: string | null;
  attributedName: string | null;
  agentShareAmount: number | null;
}

export interface AgencyTeamMember {
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  splitPct: number;
  deals: number;
  commissionTotal: number;
  shareTotal: number;
}

export interface AgencyTeam {
  members: AgencyTeamMember[];
  unassigned: { deals: number; commissionTotal: number };
}

export interface AgencyCommissionSummary {
  config: { lettingPct: number; renewalPct: number };
  totals: { earned: number; paid: number; count: number };
  commissions: AgencyCommission[];
}

export interface AgencyPayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export interface AgencyPayoutSummary {
  available: number;
  accountSet: boolean;
}

export interface AgencyPayout {
  id: string;
  amount: number;
  status: string;
  commissions: number;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export const agencyCommissionService = {
  summary(): Promise<ApiResponse<AgencyCommissionSummary>> {
    return safeCall(() => authFetch<AgencyCommissionSummary>('/agency/commissions'));
  },

  setConfig(rates: {
    lettingPct: number;
    renewalPct: number;
  }): Promise<ApiResponse<AgencyCommissionSummary>> {
    return safeCall(() =>
      authFetch<AgencyCommissionSummary>('/agency/commissions/config', {
        method: 'PUT',
        body: JSON.stringify(rates),
      })
    );
  },

  getPayoutAccount(): Promise<ApiResponse<AgencyPayoutAccount>> {
    return safeCall(() => authFetch<AgencyPayoutAccount>('/agency/commissions/payout-account'));
  },

  savePayoutAccount(input: {
    bankCode: string;
    accountNumber: string;
  }): Promise<ApiResponse<AgencyPayoutAccount>> {
    return safeCall(() =>
      authFetch<AgencyPayoutAccount>('/agency/commissions/payout-account', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  payoutSummary(): Promise<ApiResponse<AgencyPayoutSummary>> {
    return safeCall(() => authFetch<AgencyPayoutSummary>('/agency/commissions/payouts/summary'));
  },

  listPayouts(): Promise<ApiResponse<AgencyPayout[]>> {
    return safeCall(() => authFetch<AgencyPayout[]>('/agency/commissions/payouts'));
  },

  requestPayout(): Promise<ApiResponse<AgencyPayout>> {
    return safeCall(() =>
      authFetch<AgencyPayout>('/agency/commissions/payouts/request', { method: 'POST' })
    );
  },

  team(): Promise<ApiResponse<AgencyTeam>> {
    return safeCall(() => authFetch<AgencyTeam>('/agency/commissions/team'));
  },

  setAgentSplit(userId: string, splitPct: number): Promise<ApiResponse<AgencyTeam>> {
    return safeCall(() =>
      authFetch<AgencyTeam>(`/agency/commissions/team/${userId}/split`, {
        method: 'PUT',
        body: JSON.stringify({ splitPct }),
      })
    );
  },

  assignAgent(
    commissionId: string,
    agentUserId: string | null,
    splitPct?: number
  ): Promise<ApiResponse<unknown>> {
    return safeCall(() =>
      authFetch<unknown>(`/agency/commissions/${commissionId}/agent`, {
        method: 'PUT',
        body: JSON.stringify({ agentUserId, splitPct }),
      })
    );
  },

  // --- Per-agent on-platform payouts -------------------------------------------

  /** Firm view: each agent's unpaid share + whether they're ready to be paid. */
  agentPayable(): Promise<ApiResponse<AgentPayable[]>> {
    return safeCall(() => authFetch<AgentPayable[]>('/agency/commissions/agent-payouts/payable'));
  },

  /** Firm action: pay every ready agent their outstanding share. */
  runAgentPayouts(): Promise<ApiResponse<AgentPayRunResult>> {
    return safeCall(() =>
      authFetch<AgentPayRunResult>('/agency/commissions/agent-payouts/run', { method: 'POST' })
    );
  },

  /** The signed-in agent's own payout account. */
  getMyAgentAccount(): Promise<ApiResponse<AgentPayoutAccount>> {
    return safeCall(() =>
      authFetch<AgentPayoutAccount>('/agency/commissions/agent-payouts/my-account')
    );
  },

  saveMyAgentAccount(input: {
    bankCode: string;
    accountNumber: string;
  }): Promise<ApiResponse<AgentPayoutAccount>> {
    return safeCall(() =>
      authFetch<AgentPayoutAccount>('/agency/commissions/agent-payouts/my-account', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  myAgentSummary(): Promise<ApiResponse<AgentPayoutSummary>> {
    return safeCall(() =>
      authFetch<AgentPayoutSummary>('/agency/commissions/agent-payouts/my-summary')
    );
  },

  myAgentPayouts(): Promise<ApiResponse<AgentPayout[]>> {
    return safeCall(() => authFetch<AgentPayout[]>('/agency/commissions/agent-payouts/my-payouts'));
  },
};

export interface AgentPayable {
  agentUserId: string;
  agentName: string;
  payable: number;
  commissions: number;
  accountSet: boolean;
  tier: number;
  ready: boolean;
}

export interface AgentPayout {
  id: string;
  agentUserId: string;
  amount: number;
  status: string;
  commissions: number;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AgentPayRunResult {
  paid: AgentPayout[];
  skipped: { agentUserId: string; agentName: string; payable: number; reason: string }[];
}

export interface AgentPayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export interface AgentPayoutSummary {
  earned: number;
  paid: number;
  pending: number;
  accountSet: boolean;
  tier: number;
  withdrawTierRequired: number;
  canReceive: boolean;
  /** The agency the viewer belongs to; null outside one. */
  agencyName: string | null;
}
