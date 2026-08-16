import { ApiError } from '@getrentos/shared';
import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import { getAuthToken } from '@getrentos/shared';
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
  AdminDocument,
  AdminDocumentCategory,
  Conversation,
  ThreadMessage,
  RevenuePoint,
  RevenueBreakdown,
  NotificationPreference,
  PlatformConfig,
  AdminProfile,
  AdminStaffMember,
  AdminStaffApproval,
  AdminStaffRole,
} from '@/types/admin';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Raw staff rows as returned by the backend (enums are uppercase). */
interface RawStaffRow {
  id: string;
  legalName: string;
  email: string | null;
  accountStatus: string;
  lastLoginAt: string | null;
  roles: { role: string }[];
  staffApproval?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    createdBy: { id: string; legalName: string; email: string };
  } | null;
}

interface RawApprovalRow {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  createdBy: { id: string; legalName: string; email: string; roles: { role: string }[] };
  staffUser: {
    id: string;
    email: string | null;
    legalName: string;
    accountStatus: string;
    roles: { role: string }[];
  };
}

/** Maps a backend staff row to the lowercase shape the UI consumes. */
function normalizeStaffRow(row: RawStaffRow): AdminStaffMember {
  return {
    ...row,
    accountStatus: row.accountStatus.toLowerCase() as AdminStaffMember['accountStatus'],
    roles: row.roles.map((r) => ({ role: r.role.toLowerCase() as AdminStaffRole })),
    staffApproval: row.staffApproval ?? null,
  };
}

function normalizeApprovalRow(row: RawApprovalRow): AdminStaffApproval {
  return {
    ...row,
    createdBy: {
      ...row.createdBy,
      roles: row.createdBy.roles.map((r) => ({ role: r.role.toLowerCase() as AdminStaffRole })),
    },
    staffUser: {
      ...row.staffUser,
      accountStatus: row.staffUser.accountStatus.toLowerCase(),
      roles: row.staffUser.roles.map((r) => ({ role: r.role.toLowerCase() as AdminStaffRole })),
    },
  };
}

export const adminService = {
  // ---- Staff access ----
  async listStaff(): Promise<ApiResponse<AdminStaffMember[]>> {
    return safeCall(async () => {
      const rows = await authFetch<RawStaffRow[]>('/admin/access/staff');
      return rows.map(normalizeStaffRow);
    });
  },

  async createStaff(input: {
    email: string;
    legalName: string;
    password: string;
    roles: AdminStaffRole[];
  }): Promise<ApiResponse<AdminStaffMember & { approval?: { id: string; status: string } }>> {
    return safeCall(() =>
      authFetch('/admin/access/staff', {
        method: 'POST',
        body: JSON.stringify({
          email: input.email,
          legalName: input.legalName,
          password: input.password,
          roles: input.roles.map((role) => role.toUpperCase()),
        }),
      })
    );
  },

  async updateStaffRoles(
    id: string,
    roles: AdminStaffRole[]
  ): Promise<ApiResponse<AdminStaffMember>> {
    return safeCall(() =>
      authFetch(`/admin/access/staff/${id}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roles: roles.map((role) => role.toUpperCase()) }),
      })
    );
  },

  async setStaffStatus(
    id: string,
    status: 'active' | 'suspended'
  ): Promise<ApiResponse<AdminStaffMember>> {
    return safeCall(() =>
      authFetch(`/admin/access/staff/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    );
  },

  async resetStaffPassword(
    id: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      authFetch(`/admin/access/staff/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      })
    );
  },

  async listApprovals(): Promise<ApiResponse<AdminStaffApproval[]>> {
    return safeCall(async () => {
      const rows = await authFetch<RawApprovalRow[]>('/admin/access/approvals');
      return rows.map(normalizeApprovalRow);
    });
  },

  async approveStaff(approvalId: string): Promise<ApiResponse<AdminStaffApproval>> {
    return safeCall(() =>
      authFetch(`/admin/access/approvals/${approvalId}/approve`, {
        method: 'POST',
      })
    );
  },

  async rejectStaff(approvalId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      authFetch(`/admin/access/approvals/${approvalId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

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

  // ---- Documents ----
  async listDocuments(
    params: { search?: string; category?: string } = {}
  ): Promise<ApiResponse<AdminDocument[]>> {
    return safeCall(() => authFetch(`/admin/documents${toQuery(params)}`));
  },

  async uploadDocument(
    name: string,
    category: AdminDocumentCategory,
    file: File
  ): Promise<ApiResponse<AdminDocument>> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('file', file);
    return safeCall(() => authFetch('/admin/documents', { method: 'POST', body: formData }));
  },

  async getDocumentDownloadUrl(id: string): Promise<ApiResponse<{ url: string; name: string }>> {
    return safeCall(() => authFetch(`/admin/documents/${id}/download`));
  },

  // ---- Messages ----
  async listConversations(params: { search?: string } = {}): Promise<ApiResponse<Conversation[]>> {
    return safeCall(() => authFetch(`/admin/messages/conversations${toQuery(params)}`));
  },

  async getConversationMessages(conversationId: string): Promise<ApiResponse<ThreadMessage[]>> {
    return safeCall(() => authFetch(`/admin/messages/conversations/${conversationId}/messages`));
  },

  async sendConversationMessage(
    conversationId: string,
    text: string
  ): Promise<ApiResponse<ThreadMessage>> {
    return safeCall(() =>
      authFetch(`/admin/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
    );
  },

  async markConversationRead(conversationId: string): Promise<ApiResponse<{ success: boolean }>> {
    return safeCall(() =>
      authFetch(`/admin/messages/conversations/${conversationId}/read`, { method: 'PATCH' })
    );
  },

  // ---- Reports ----
  async getReportsStats(): Promise<
    ApiResponse<{
      gmvYtd: number;
      activeUsers: number;
      avgTrustScore: number;
      momGrowthPct: number;
    }>
  > {
    return safeCall(() => authFetch('/admin/reports/stats'));
  },

  async getRevenueSeries(months = 6): Promise<ApiResponse<RevenuePoint[]>> {
    return safeCall(() => authFetch(`/admin/reports/revenue-series?months=${months}`));
  },

  async getGmvBreakdown(): Promise<ApiResponse<RevenueBreakdown[]>> {
    return safeCall(() => authFetch('/admin/reports/gmv-breakdown'));
  },

  /** Triggers a browser download of the transactions CSV export. */
  async exportReportsCsv(): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/reports/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new ApiError(response.status, 'Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'getrentos-transactions.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  // ---- Settings ----
  async getProfile(): Promise<ApiResponse<AdminProfile>> {
    return safeCall(() => authFetch('/admin/profile'));
  },

  async updateProfile(
    data: Partial<{ fullName: string; email: string; phone: string }>
  ): Promise<ApiResponse<AdminProfile>> {
    return safeCall(() =>
      authFetch('/admin/profile', { method: 'PATCH', body: JSON.stringify(data) })
    );
  },

  async uploadAvatar(file: File): Promise<ApiResponse<AdminProfile>> {
    const formData = new FormData();
    formData.append('file', file);
    return safeCall(() => authFetch('/admin/profile/avatar', { method: 'POST', body: formData }));
  },

  async getNotificationPreferences(): Promise<ApiResponse<NotificationPreference[]>> {
    return safeCall(() => authFetch('/admin/settings/notifications'));
  },

  async updateNotificationPreferences(
    preferences: NotificationPreference[]
  ): Promise<ApiResponse<NotificationPreference[]>> {
    return safeCall(() =>
      authFetch('/admin/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      })
    );
  },

  async getPlatformConfig(): Promise<ApiResponse<PlatformConfig>> {
    return safeCall(() => authFetch('/admin/settings/platform-config'));
  },

  async updatePlatformConfig(config: PlatformConfig): Promise<ApiResponse<PlatformConfig>> {
    return safeCall(() =>
      authFetch('/admin/settings/platform-config', { method: 'PUT', body: JSON.stringify(config) })
    );
  },
};
