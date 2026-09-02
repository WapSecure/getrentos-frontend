import { authDownload, authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
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

export interface AdminActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

/** Standard server-side paginated envelope ({ items, total, page, pageSize, totalPages }). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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
  async listStaff(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<AdminStaffMember>>> {
    return safeCall(async () => {
      const query = toQuery({
        page: params.page?.toString(),
        pageSize: params.pageSize?.toString(),
      });
      const response = await authFetch<Paginated<RawStaffRow>>(`/admin/access/staff${query}`);
      return { ...response, items: response.items.map(normalizeStaffRow) };
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

  async listApprovals(
    params: { page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<AdminStaffApproval>>> {
    return safeCall(async () => {
      const query = toQuery({
        page: params.page?.toString(),
        pageSize: params.pageSize?.toString(),
      });
      const response = await authFetch<Paginated<RawApprovalRow>>(
        `/admin/access/approvals${query}`
      );
      return { ...response, items: response.items.map(normalizeApprovalRow) };
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

  async getDashboardActivity(): Promise<ApiResponse<AdminActivityItem[]>> {
    return safeCall(() => authFetch('/admin/dashboard/activity'));
  },

  async getUserGrowth(): Promise<ApiResponse<{ label: string; value: number }[]>> {
    return safeCall(() => authFetch('/admin/dashboard/user-growth'));
  },

  async getNotifications(): Promise<ApiResponse<AdminNotification[]>> {
    return safeCall(() => authFetch('/admin/notifications'));
  },

  async markNotificationRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return safeCall(() => authFetch(`/admin/notifications/${id}/read`, { method: 'PATCH' }));
  },

  async markAllNotificationsRead(): Promise<ApiResponse<{ success: boolean }>> {
    return safeCall(() => authFetch('/admin/notifications/read-all', { method: 'POST' }));
  },

  // ---- Users ----
  async listUsers(
    params: {
      search?: string;
      status?: string;
      role?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<PlatformUser>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      role: params.role,
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/users${query}`));
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
    params: {
      search?: string;
      status?: string;
      type?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<VerificationRequest>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      type: params.type,
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/verifications${query}`));
  },

  async approveVerification(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/admin/verifications/${id}/approve`, { method: 'POST' }));
  },

  /** Full detail incl. the real submitted documents (signed preview URLs) for a verification request. */
  async getVerificationDetail(id: string): Promise<ApiResponse<VerificationRequest>> {
    return safeCall(() => authFetch(`/admin/verifications/${id}`));
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
    params: {
      search?: string;
      status?: string;
      category?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<Dispute>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      category: params.category,
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/disputes${query}`));
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
    params: {
      search?: string;
      status?: string;
      severity?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<FraudAlert>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      severity: params.severity,
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/fraud-alerts${query}`));
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
    params: {
      search?: string;
      status?: string;
      flagged?: boolean;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<PlatformEscrowTransaction>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      flagged: params.flagged === undefined ? undefined : String(params.flagged),
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/escrow${query}`));
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
    params: { search?: string; severity?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<AuditLogEntry>>> {
    const query = toQuery({
      search: params.search,
      severity: params.severity,
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/audit-logs${query}`));
  },

  // ---- Documents ----
  async listDocuments(
    params: { search?: string; category?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<AdminDocument>>> {
    const query = toQuery({
      search: params.search,
      category: params.category,
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/documents${query}`));
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
  async listConversations(
    params: { search?: string; page?: number; pageSize?: number } = {}
  ): Promise<ApiResponse<Paginated<Conversation>>> {
    const query = toQuery({
      search: params.search,
      page: params.page?.toString(),
      pageSize: params.pageSize?.toString(),
    });
    return safeCall(() => authFetch(`/admin/messages/conversations${query}`));
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
      const blob = await authDownload('/admin/reports/export');
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
