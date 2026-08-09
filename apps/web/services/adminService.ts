import { apiFetch, ApiError } from '@/lib/apiClient';
import { STORAGE_KEYS } from '@/lib/constants/auth';
import type {
  PlatformUser,
  UserAccountStatus,
  VerificationRequest,
  Dispute,
  DisputeMessage,
  FraudAlert,
  FraudAlertStatus,
  PlatformEscrowTransaction,
  AuditLogEntry,
} from '@/types/admin';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  openDisputes: number;
  fraudAlerts: number;
  activeEscrowTransactions: number;
  platformGmv: number;
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

async function safeCall<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, error: err.message, message: err.message };
    }
    return {
      success: false,
      error: 'Something went wrong',
      message: 'Something went wrong. Please try again.',
    };
  }
}

function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

function toQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v && v !== 'all');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries as [string, string][]).toString();
}

export const adminService = {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return safeCall(() => authFetch('/admin/dashboard/stats'));
  },

  // ---- Users ----
  async listUsers(
    params: { search?: string; status?: string; role?: string } = {}
  ): Promise<ApiResponse<PlatformUser[]>> {
    return safeCall(() => authFetch(`/admin/users${toQuery(params)}`));
  },

  async updateUserStatus(
    userId: string,
    status: UserAccountStatus
  ): Promise<ApiResponse<PlatformUser>> {
    return safeCall(() =>
      authFetch(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    );
  },

  // ---- Verifications ----
  async listVerifications(
    params: { search?: string; status?: string; type?: string } = {}
  ): Promise<ApiResponse<VerificationRequest[]>> {
    return safeCall(() => authFetch(`/admin/verifications${toQuery(params)}`));
  },

  async approveVerification(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/admin/verifications/${id}/approve`, { method: 'POST' }));
  },

  async rejectVerification(id: string, reason: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/admin/verifications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  async requestVerificationClarification(id: string, reason: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/admin/verifications/${id}/request-clarification`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  // ---- Disputes ----
  async listDisputes(
    params: { search?: string; status?: string; category?: string } = {}
  ): Promise<ApiResponse<Dispute[]>> {
    return safeCall(() => authFetch(`/admin/disputes${toQuery(params)}`));
  },

  async getDisputeMessages(disputeId: string): Promise<ApiResponse<DisputeMessage[]>> {
    return safeCall(() => authFetch(`/admin/disputes/${disputeId}/messages`));
  },

  async sendDisputeMessage(disputeId: string, text: string): Promise<ApiResponse<DisputeMessage>> {
    return safeCall(() =>
      authFetch(`/admin/disputes/${disputeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    );
  },

  async resolveDispute(disputeId: string, resolution?: string): Promise<ApiResponse<Dispute>> {
    return safeCall(() =>
      authFetch(`/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      })
    );
  },

  async escalateDispute(disputeId: string): Promise<ApiResponse<Dispute>> {
    return safeCall(() => authFetch(`/admin/disputes/${disputeId}/escalate`, { method: 'POST' }));
  },

  // ---- Fraud alerts ----
  async listFraudAlerts(
    params: { search?: string; status?: string; severity?: string } = {}
  ): Promise<ApiResponse<FraudAlert[]>> {
    return safeCall(() => authFetch(`/admin/fraud-alerts${toQuery(params)}`));
  },

  async updateFraudAlertStatus(
    id: string,
    status: FraudAlertStatus
  ): Promise<ApiResponse<FraudAlert>> {
    return safeCall(() =>
      authFetch(`/admin/fraud-alerts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    );
  },

  // ---- Escrow oversight ----
  async listEscrowTransactions(
    params: { search?: string; status?: string } = {}
  ): Promise<ApiResponse<PlatformEscrowTransaction[]>> {
    return safeCall(() => authFetch(`/admin/escrow${toQuery(params)}`));
  },

  async toggleEscrowFlag(
    id: string,
    flagged: boolean,
    reason?: string
  ): Promise<ApiResponse<PlatformEscrowTransaction>> {
    return safeCall(() =>
      authFetch(`/admin/escrow/${id}/flag`, {
        method: 'PATCH',
        body: JSON.stringify({ flagged, reason }),
      })
    );
  },

  // ---- Audit logs ----
  async listAuditLogs(
    params: { search?: string; severity?: string; page?: number; limit?: number } = {}
  ): Promise<ApiResponse<PaginatedAuditLogs>> {
    const query = toQuery({
      search: params.search,
      severity: params.severity,
      page: params.page?.toString(),
      limit: params.limit?.toString(),
    });
    return safeCall(() => authFetch(`/admin/audit-logs${query}`));
  },
};
