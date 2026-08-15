import type { RenterListingsFilters } from '@/services/renterService';

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
  staff: ['admin', 'staff'] as const,
  staffApprovals: ['admin', 'staffApprovals'] as const,
};

export const renterKeys = {
  dashboardStats: ['renter', 'dashboardStats'] as const,
  listings: (filters?: RenterListingsFilters) =>
    [
      'renter',
      'listings',
      filters?.search ?? '',
      filters?.location ?? '',
      filters?.minPrice ?? '',
      filters?.maxPrice ?? '',
      filters?.bedrooms ?? '',
      filters?.bathrooms ?? '',
      filters?.propertyType ?? '',
      filters?.verifiedOnly ?? false,
    ] as const,
  listing: (id: string) => ['renter', 'listing', id] as const,
  geoInsights: (id: string) => ['renter', 'listing', id, 'geo-insights'] as const,
  savedListings: ['renter', 'savedListings'] as const,
  applications: ['renter', 'applications'] as const,
  roommates: ['renter', 'roommates'] as const,
  roommateExpenses: ['renter', 'roommateExpenses'] as const,
  calendarEvents: ['renter', 'calendarEvents'] as const,
  trustScore: ['renter', 'trustScore'] as const,
  documents: ['renter', 'documents'] as const,
  conversations: ['renter', 'conversations'] as const,
  reminders: ['renter', 'reminders'] as const,
  lease: ['renter', 'lease'] as const,
  rentIncreases: ['renter', 'rentIncreases'] as const,
  upcomingPaymentReminders: ['renter', 'upcomingPaymentReminders'] as const,
  renewalOffer: ['renter', 'renewalOffer'] as const,
  payments: ['renter', 'payments'] as const,
  receipts: ['renter', 'receipts'] as const,
  paymentMethods: ['renter', 'paymentMethods'] as const,
  maintenanceRequests: ['renter', 'maintenanceRequests'] as const,
  notifications: ['renter', 'notifications'] as const,
  notificationPreferences: ['renter', 'notificationPreferences'] as const,
  reviewsPending: ['renter', 'reviews', 'pending'] as const,
  reviewsSubmitted: ['renter', 'reviews', 'submitted'] as const,
  recentlyViewed: ['renter', 'recentlyViewed'] as const,
  wishlists: ['renter', 'wishlists'] as const,
  recommendations: ['renter', 'recommendations'] as const,
  applicationAssistant: ['renter', 'applicationAssistant'] as const,
  savedSearches: ['renter', 'savedSearches'] as const,
  profile: ['renter', 'profile'] as const,
};

export const realtorKeys = {
  dashboard: ['realtor', 'dashboard'] as const,
  clients: ['realtor', 'clients'] as const,
  listings: ['realtor', 'listings'] as const,
  leads: ['realtor', 'leads'] as const,
  viewings: ['realtor', 'viewings'] as const,
  offers: ['realtor', 'offers'] as const,
  documents: ['realtor', 'documents'] as const,
  conversations: ['realtor', 'conversations'] as const,
  conversationMessages: (conversationId: string) =>
    ['realtor', 'conversations', conversationId, 'messages'] as const,
  clientInvitations: ['realtor', 'client-invitations'] as const,
  assignableProperties: (invitationId: string) =>
    ['realtor', 'assignable-properties', invitationId] as const,
};

export const agentKeys = {
  dashboard: ['agent', 'dashboard'] as const,
  profile: ['agent', 'profile'] as const,
  tasks: ['agent', 'tasks'] as const,
  properties: ['agent', 'properties'] as const,
  inspections: ['agent', 'inspections'] as const,
  verifications: ['agent', 'verifications'] as const,
  documents: ['agent', 'documents'] as const,
  conversations: ['agent', 'conversations'] as const,
  conversationMessages: (id: string) => ['agent', 'conversations', id, 'messages'] as const,
  clients: ['agent', 'clients'] as const,
  clientAssignments: ['agent', 'client-assignments'] as const,
  assignableProperties: (assignmentId: string) =>
    ['agent', 'assignable-properties', assignmentId] as const,
};

export const homeManagementKeys = {
  dashboard: ['home-management', 'dashboard'] as const,
  assets: (propertyId?: string) => ['home-management', 'assets', propertyId ?? 'all'] as const,
  plans: ['home-management', 'plans'] as const,
  units: (propertyId?: string) => ['home-management', 'units', propertyId ?? 'none'] as const,
  workOrders: ['home-management', 'work-orders'] as const,
  slaPolicies: (propertyId?: string) =>
    ['home-management', 'sla-policies', propertyId ?? 'none'] as const,
  escalations: (propertyId?: string) =>
    ['home-management', 'escalations', propertyId ?? 'all'] as const,
  workOrderQuotes: (workOrderId: string) =>
    ['home-management', 'work-orders', workOrderId, 'quotes'] as const,
  workOrderInvoices: (workOrderId: string) =>
    ['home-management', 'work-orders', workOrderId, 'invoices'] as const,
  inspections: ['home-management', 'inspections'] as const,
  timeline: (params?: { propertyId?: string; limit?: number }) =>
    [
      'home-management',
      'timeline',
      params?.propertyId ?? 'all',
      params?.limit ?? 'default',
    ] as const,
  documents: (role: 'owner' | 'landlord') => ['home-management', role, 'documents'] as const,
  properties: (role: 'owner' | 'landlord') => ['home-management', role, 'properties'] as const,
  vendors: ['home-management', 'landlord', 'vendors'] as const,
};

export const ownerKeys = {
  dashboard: ['owner', 'dashboard'] as const,
  properties: ['owner', 'properties'] as const,
  listings: ['owner', 'listings'] as const,
  offers: ['owner', 'offers'] as const,
  transactions: ['owner', 'transactions'] as const,
  analytics: ['owner', 'analytics'] as const,
  leads: ['owner', 'leads'] as const,
  documents: ['owner', 'documents'] as const,
  reviews: ['owner', 'reviews'] as const,
  profile: ['owner', 'profile'] as const,
  conversations: ['owner', 'conversations'] as const,
  messages: (conversationId: string) =>
    ['owner', 'conversations', conversationId, 'messages'] as const,
};

export const buyerKeys = {
  dashboard: ['buyer', 'dashboard'] as const,
  listings: ['buyer', 'listings'] as const,
  saved: ['buyer', 'saved'] as const,
  viewings: ['buyer', 'viewings'] as const,
  offers: ['buyer', 'offers'] as const,
  transactions: ['buyer', 'transactions'] as const,
  documents: ['buyer', 'documents'] as const,
  reviews: ['buyer', 'reviews'] as const,
  profile: ['buyer', 'profile'] as const,
  conversations: ['buyer', 'conversations'] as const,
  messages: (conversationId: string) =>
    ['buyer', 'conversations', conversationId, 'messages'] as const,
};
