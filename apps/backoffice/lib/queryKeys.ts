export const adminKeys = {
  dashboardStats: ['admin', 'dashboardStats'] as const,
  dashboardActivity: ['admin', 'dashboardActivity'] as const,
  userGrowth: ['admin', 'userGrowth'] as const,
  notifications: ['admin', 'notifications'] as const,
  users: (params?: {
    search?: string;
    status?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  }) =>
    [
      'admin',
      'users',
      params?.search ?? '',
      params?.status ?? 'all',
      params?.role ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  verifications: (params?: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  }) =>
    [
      'admin',
      'verifications',
      params?.search ?? '',
      params?.status ?? 'all',
      params?.type ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  disputes: (params?: {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) =>
    [
      'admin',
      'disputes',
      params?.search ?? '',
      params?.status ?? 'all',
      params?.category ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  disputeMessages: (disputeId: string) => ['admin', 'disputes', disputeId, 'messages'] as const,
  fraudAlerts: (params?: {
    search?: string;
    status?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
  }) =>
    [
      'admin',
      'fraudAlerts',
      params?.search ?? '',
      params?.status ?? 'all',
      params?.severity ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  escrowTransactions: (params?: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) =>
    [
      'admin',
      'escrow',
      params?.search ?? '',
      params?.status ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  auditLogs: (params?: { search?: string; severity?: string; page?: number; pageSize?: number }) =>
    [
      'admin',
      'auditLogs',
      params?.search ?? '',
      params?.severity ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  documents: (params?: { search?: string; category?: string; page?: number; pageSize?: number }) =>
    [
      'admin',
      'documents',
      params?.search ?? '',
      params?.category ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  conversations: (params?: { search?: string; page?: number; pageSize?: number }) =>
    [
      'admin',
      'conversations',
      params?.search ?? '',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  conversationMessages: (conversationId: string) =>
    ['admin', 'conversations', conversationId, 'messages'] as const,
  reportsStats: ['admin', 'reportsStats'] as const,
  revenueSeries: (months: number) => ['admin', 'revenueSeries', months] as const,
  gmvBreakdown: ['admin', 'gmvBreakdown'] as const,
  profile: ['admin', 'profile'] as const,
  notificationPreferences: ['admin', 'notificationPreferences'] as const,
  platformConfig: ['admin', 'platformConfig'] as const,
  staff: ['admin', 'staff'] as const,
  staffApprovals: ['admin', 'staffApprovals'] as const,
  staffList: (params?: { page?: number; pageSize?: number }) =>
    ['admin', 'staff', params?.page ?? 1, params?.pageSize ?? 20] as const,
  staffApprovalsList: (params?: { page?: number; pageSize?: number }) =>
    ['admin', 'staffApprovals', params?.page ?? 1, params?.pageSize ?? 20] as const,
  rentalOverview: ['admin', 'rentals', 'overview'] as const,
  rentals: (
    resource: string,
    params?: { search?: string; status?: string; page?: number; pageSize?: number }
  ) =>
    [
      'admin',
      'rentals',
      resource,
      params?.search ?? '',
      params?.status ?? 'all',
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
  rentFinanceOverview: ['admin', 'rentFinance', 'overview'] as const,
  rentFinance: (
    resource: string,
    params?: {
      search?: string;
      status?: string;
      escrowStatus?: string;
      category?: string;
      verified?: boolean;
      page?: number;
      pageSize?: number;
    }
  ) =>
    [
      'admin',
      'rentFinance',
      resource,
      params?.search ?? '',
      params?.status ?? 'all',
      params?.escrowStatus ?? 'all',
      params?.category ?? 'all',
      params?.verified === undefined ? 'all' : String(params.verified),
      params?.page ?? 1,
      params?.pageSize ?? 20,
    ] as const,
};
