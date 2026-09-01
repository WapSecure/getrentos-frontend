import type { RenterListingsFilters } from '@/services/renterService';

export const landlordKeys = {
  dashboardStats: ['landlord', 'dashboardStats'] as const,
  dashboardActivity: ['landlord', 'dashboardActivity'] as const,
  revenueTrend: ['landlord', 'revenueTrend'] as const,
  notifications: ['landlord', 'notifications'] as const,
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
  arrearsSummary: ['landlord', 'arrearsSummary'] as const,
  financialStats: (period: string) => ['landlord', 'financialStats', period] as const,
  financialChart: ['landlord', 'financialChart'] as const,
  expenses: (params?: { propertyId?: string; category?: string }) =>
    ['landlord', 'expenses', params?.propertyId ?? 'all', params?.category ?? 'all'] as const,
  managementFeeConfig: (propertyId: string) =>
    ['landlord', 'managementFeeConfig', propertyId] as const,
  ownerStatements: ['landlord', 'ownerStatements'] as const,
  ownerStatement: (id: string) => ['landlord', 'ownerStatements', id] as const,
  vendors: ['landlord', 'vendors'] as const,
  maintenanceRequests: (params?: { status?: string; priority?: string }) =>
    [
      'landlord',
      'maintenanceRequests',
      params?.status ?? 'all',
      params?.priority ?? 'all',
    ] as const,
  maintenanceSummary: ['landlord', 'maintenanceSummary'] as const,
  evictions: ['landlord', 'evictions'] as const,
  leads: ['landlord', 'leads'] as const,
  micrositeSettings: ['landlord', 'microsite'] as const,
  reviews: ['landlord', 'reviews'] as const,
  reviewSummary: ['landlord', 'reviews', 'summary'] as const,
  conversations: ['landlord', 'conversations'] as const,
  conversationMessages: (conversationId: string) =>
    ['landlord', 'conversations', conversationId, 'messages'] as const,
  tenancyStanding: (applicationId: string) =>
    ['landlord', 'tenancyStanding', applicationId] as const,
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
      filters?.page ?? 1,
      filters?.pageSize ?? 20,
    ] as const,
  listing: (id: string) => ['renter', 'listing', id] as const,
  geoInsights: (id: string) => ['renter', 'listing', id, 'geo-insights'] as const,
  savedListings: ['renter', 'savedListings'] as const,
  applications: ['renter', 'applications'] as const,
  allApplicationNotes: ['renter', 'applications', 'notes'] as const,
  applicationNotes: (applicationId: string) =>
    ['renter', 'applications', applicationId, 'notes'] as const,
  roommates: ['renter', 'roommates'] as const,
  roommateExpenses: ['renter', 'roommateExpenses'] as const,
  calendarEvents: ['renter', 'calendarEvents'] as const,
  trustScore: ['renter', 'trustScore'] as const,
  creditReporting: ['renter', 'creditReporting'] as const,
  financing: ['renter', 'financing'] as const,
  ussdMenu: ['renter', 'ussdMenu'] as const,
  documents: ['renter', 'documents'] as const,
  documentSummary: ['renter', 'documents', 'summary'] as const,
  conversations: ['renter', 'conversations'] as const,
  reminders: ['renter', 'reminders'] as const,
  messageTemplates: ['renter', 'messageTemplates'] as const,
  quickReplies: ['renter', 'quickReplies'] as const,
  moveOutChecklist: ['renter', 'moveOutChecklist'] as const,
  lease: ['renter', 'lease'] as const,
  pendingLease: ['renter', 'lease', 'pending'] as const,
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
  settingsPreferences: ['renter', 'settings', 'preferences'] as const,
  profile: ['renter', 'profile'] as const,
  twoFactor: ['renter', 'settings', 'twoFactor'] as const,
  inspections: ['renter', 'inspections'] as const,
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
  trustProfile: ['realtor', 'trust-profile'] as const,
  reviews: ['realtor', 'reviews'] as const,
  commissions: ['realtor', 'commissions'] as const,
  commissionTrend: ['realtor', 'commissions', 'trend'] as const,
  settingsProfile: ['realtor', 'settings', 'profile'] as const,
  settingsPayout: ['realtor', 'settings', 'payout'] as const,
  settingsNotifications: ['realtor', 'settings', 'notifications'] as const,
  settingsPreferences: ['realtor', 'settings', 'preferences'] as const,
  notifications: ['realtor', 'notifications'] as const,
  activity: ['realtor', 'activity'] as const,
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
  trustProfile: ['agent', 'trust-profile'] as const,
  reviews: ['agent', 'reviews'] as const,
  sync: ['agent', 'sync'] as const,
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
  realtors: ['owner', 'leads', 'realtors'] as const,
  documents: ['owner', 'documents'] as const,
  reviews: ['owner', 'reviews'] as const,
  reviewSummary: ['owner', 'reviews', 'summary'] as const,
  profile: ['owner', 'profile'] as const,
  conversations: ['owner', 'conversations'] as const,
  messages: (conversationId: string) =>
    ['owner', 'conversations', conversationId, 'messages'] as const,
  trustProfile: ['owner', 'trust-profile'] as const,
  payoutSettings: ['owner', 'settings', 'payout'] as const,
  notificationPrefs: ['owner', 'settings', 'notifications'] as const,
  preferences: ['owner', 'settings', 'preferences'] as const,
  notifications: ['owner', 'notifications'] as const,
  portfolioTrend: ['owner', 'analytics', 'portfolio-trend'] as const,
  marketInsights: (city?: string) => ['owner', 'analytics', 'market-insights', city ?? ''] as const,
  offerThread: (offerId: string) => ['owner', 'offers', offerId, 'thread'] as const,
};

export const landKeys = {
  owner: ['land', 'owner'] as const,
  ownerDetail: (propertyId: string) => ['land', 'owner', propertyId] as const,
  public: ['land', 'public'] as const,
  publicListing: (listingId: string) => ['land', 'public', listingId] as const,
};

export const shortletKeys = {
  public: ['shortlets', 'public'] as const,
  listing: (listingId: string) => ['shortlets', 'public', listingId] as const,
  availability: (listingId: string) => ['shortlets', 'availability', listingId] as const,
  guestBookings: ['shortlets', 'bookings'] as const,
  hostListings: ['shortlets', 'host', 'listings'] as const,
  hostBookings: ['shortlets', 'host', 'bookings'] as const,
  hostBlockedDates: (listingId: string) =>
    ['shortlets', 'host', listingId, 'blocked-dates'] as const,
  guestMessages: ['shortlets', 'messages'] as const,
  hostMessages: ['shortlets', 'host', 'messages'] as const,
  hostPayouts: ['shortlets', 'host', 'payouts'] as const,
  hostAnalytics: ['shortlets', 'host', 'analytics'] as const,
  hostAnalyticsViews: ['shortlets', 'host', 'analytics-views'] as const,
  disputes: ['shortlets', 'disputes'] as const,
  depositClaims: ['shortlets', 'deposit-claims'] as const,
  guestReviews: ['shortlets', 'guest-reviews'] as const,
  wishlistIds: ['shortlets', 'wishlist', 'ids'] as const,
  wishlist: ['shortlets', 'wishlist'] as const,
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
  paymentMethod: ['buyer', 'settings', 'payment-method'] as const,
  notificationPrefs: ['buyer', 'settings', 'notifications'] as const,
  searchPreferences: ['buyer', 'settings', 'search-preferences'] as const,
  notifications: ['buyer', 'notifications'] as const,
  offerThread: (offerId: string) => ['buyer', 'offers', offerId, 'thread'] as const,
  trustProfile: ['buyer', 'trust-profile'] as const,
};

export const estateKeys = {
  myEstate: ['estate', 'me'] as const,
  households: (estateId: string) => ['estate', estateId, 'households'] as const,
  dues: (estateId: string, status?: string) =>
    ['estate', estateId, 'dues', status ?? 'all'] as const,
  visitorPasses: (estateId: string, status?: string) =>
    ['estate', estateId, 'visitorPasses', status ?? 'all'] as const,
  staff: (estateId: string) => ['estate', estateId, 'staff'] as const,
  announcements: (estateId: string) => ['estate', estateId, 'announcements'] as const,
  violations: (estateId: string, status?: string) =>
    ['estate', estateId, 'violations', status ?? 'all'] as const,
  governanceRecords: (estateId: string, type?: string) =>
    ['estate', estateId, 'governanceRecords', type ?? 'all'] as const,
  vehicleLogs: (estateId: string, filter?: string) =>
    ['estate', estateId, 'vehicleLogs', filter ?? 'all'] as const,
};

export const estateResidentKeys = {
  myHousehold: ['estate', 'resident', 'household'] as const,
  dues: (status?: string) => ['estate', 'resident', 'dues', status ?? 'all'] as const,
  announcements: ['estate', 'resident', 'announcements'] as const,
  violations: ['estate', 'resident', 'violations'] as const,
  visitorPasses: (status?: string) =>
    ['estate', 'resident', 'visitorPasses', status ?? 'all'] as const,
};
