/**
 * Centralized TanStack Query key factories for the pages backed by a real
 * API (landlordService / adminService). Keeping these here instead of
 * inlining tuples in every page avoids typo-based cache misses and makes
 * invalidation call sites easy to audit.
 */
export const landlordKeys = {
  dashboardStats: ['landlord', 'dashboardStats'] as const,
  properties: ['landlord', 'properties'] as const,
  units: (propertyId?: string) => ['landlord', 'units', propertyId ?? 'all'] as const,
  vacantUnits: ['landlord', 'units', 'vacant'] as const,
  vacantUnitsForLease: ['landlord', 'units', 'vacantForLease'] as const,
  listings: (status?: string) => ['landlord', 'listings', status ?? 'all'] as const,
  applications: (status?: string) => ['landlord', 'applications', status ?? 'all'] as const,
  leases: (status?: string) => ['landlord', 'leases', status ?? 'all'] as const,
  tenants: ['landlord', 'tenants'] as const,
  payments: (status?: string) => ['landlord', 'payments', status ?? 'all'] as const,
  rentCollectionStats: ['landlord', 'rentCollectionStats'] as const,
  financialStats: (period: string) => ['landlord', 'financialStats', period] as const,
  financialChart: ['landlord', 'financialChart'] as const,
  vendors: ['landlord', 'vendors'] as const,
  maintenanceRequests: (params?: { status?: string; priority?: string }) =>
    [
      'landlord',
      'maintenanceRequests',
      params?.status ?? 'all',
      params?.priority ?? 'all',
    ] as const,
};

export const adminKeys = {
  dashboardStats: ['admin', 'dashboardStats'] as const,
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
};
