export const adminKeys = {
  dashboardStats: ['admin', 'dashboardStats'] as const,
  dashboardActivity: ['admin', 'dashboardActivity'] as const,
  userGrowth: ['admin', 'userGrowth'] as const,
  notifications: ['admin', 'notifications'] as const,
  users: (params?: { search?: string; status?: string; role?: string }) =>
    [
      'admin',
      'users',
      params?.search ?? '',
      params?.status ?? 'all',
      params?.role ?? 'all',
    ] as const,
  verifications: (status?: string) => ['admin', 'verifications', status ?? 'all'] as const,
  disputes: (status?: string) => ['admin', 'disputes', status ?? 'all'] as const,
  disputeMessages: (disputeId: string) => ['admin', 'disputes', disputeId, 'messages'] as const,
  fraudAlerts: (status?: string) => ['admin', 'fraudAlerts', status ?? 'all'] as const,
  escrowTransactions: (status?: string) => ['admin', 'escrow', status ?? 'all'] as const,
  auditLogs: (params?: { search?: string; severity?: string; page?: number }) =>
    [
      'admin',
      'auditLogs',
      params?.search ?? '',
      params?.severity ?? 'all',
      params?.page ?? 1,
    ] as const,
  documents: (params?: { search?: string; category?: string }) =>
    ['admin', 'documents', params?.search ?? '', params?.category ?? 'all'] as const,
  conversations: (search?: string) => ['admin', 'conversations', search ?? ''] as const,
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
};
