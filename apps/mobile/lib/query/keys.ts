/**
 * Central query-key factory. Every `useQuery` key comes from here so cache
 * invalidation is precise and greppable.
 */
export const qk = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  renter: {
    dashboardStats: ['renter', 'dashboard', 'stats'] as const,
    moveInChecklist: ['renter', 'dashboard', 'move-in-checklist'] as const,
    applications: ['renter', 'applications'] as const,
    lease: ['renter', 'lease'] as const,
    payments: (page = 1, pageSize = 20) => ['renter', 'payments', { page, pageSize }] as const,
    notifications: (page = 1, pageSize = 20) =>
      ['renter', 'notifications', { page, pageSize }] as const,
    recommended: ['renter', 'recommended'] as const,
    conversations: ['renter', 'conversations'] as const,
    viewings: ['renter', 'viewings'] as const,
    pendingLease: ['renter', 'lease', 'pending'] as const,
    renewalOffer: ['renter', 'lease', 'renewal-offer'] as const,
    receipts: ['renter', 'payments', 'receipts'] as const,
    profile: ['renter', 'profile'] as const,
    twoFactorStatus: ['renter', 'settings', '2fa'] as const,
    notificationPreferences: ['renter', 'notifications', 'preferences'] as const,
    trustScore: ['renter', 'trust-score'] as const,
    wishlists: ['renter', 'wishlists'] as const,
    savedSearches: ['renter', 'saved-searches'] as const,
    maintenance: ['renter', 'maintenance'] as const,
    documents: ['renter', 'documents'] as const,
    documentSummary: ['renter', 'documents', 'summary'] as const,
    roommates: ['renter', 'roommates'] as const,
    roommateInvites: ['renter', 'roommates', 'invites'] as const,
    roommateExpenses: ['renter', 'roommates', 'expenses'] as const,
    supportThreads: ['renter', 'support', 'threads'] as const,
    supportMessages: (threadId: string) =>
      ['renter', 'support', 'threads', threadId, 'messages'] as const,
    calendarEvents: ['renter', 'calendar-events'] as const,
    moveOutChecklist: ['renter', 'dashboard', 'move-out-checklist'] as const,
    applicationAssistant: ['renter', 'application-assistant'] as const,
    applicationNotes: (applicationId: string) =>
      ['renter', 'applications', applicationId, 'notes'] as const,
    financing: ['renter', 'financing'] as const,
    creditReporting: ['renter', 'credit-reporting'] as const,
    recentlyViewed: ['renter', 'recently-viewed'] as const,
    inspections: ['renter', 'inspections'] as const,
    referrals: ['referrals', 'summary'] as const,
    dataExport: ['renter', 'settings', 'data-export'] as const,
    paymentMethods: ['renter', 'payments', 'methods'] as const,
    preferences: ['renter', 'settings', 'preferences'] as const,
    ussdMenu: ['renter', 'ussd', 'menu'] as const,
    leasePaymentReminders: ['renter', 'lease', 'payment-reminders'] as const,
    leaseRentIncreases: ['renter', 'lease', 'rent-increases'] as const,
    messageTemplates: ['renter', 'messages', 'templates'] as const,
    messageQuickReplies: ['renter', 'messages', 'quick-replies'] as const,
    messageReminders: ['renter', 'messages', 'reminders'] as const,
    reviewsPending: ['renter', 'reviews', 'pending'] as const,
    reviewsSubmitted: (page = 1, pageSize = 20) =>
      ['renter', 'reviews', 'submitted', { page, pageSize }] as const,
    reviewsReceived: (page = 1, pageSize = 20) =>
      ['renter', 'reviews', 'received', { page, pageSize }] as const,
  },
  listings: {
    /** Infinite list keyed by the active filter set. */
    search: (filters: Record<string, unknown>) => ['listings', 'search', filters] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
    saved: ['listings', 'saved'] as const,
    savedByWishlist: (wishlistId?: string) =>
      ['listings', 'saved', { wishlistId: wishlistId ?? null }] as const,
    geoInsights: (id: string, destination?: string) =>
      ['listings', 'geo-insights', id, destination ?? null] as const,
  },
  agent: {
    dashboard: ['agent', 'dashboard'] as const,
    profile: ['agent', 'profile'] as const,
    properties: (page = 1, pageSize = 20, search?: string) =>
      ['agent', 'properties', { page, pageSize, search: search ?? null }] as const,
    tasks: (page = 1, pageSize = 20, status?: string, type?: string, search?: string) =>
      [
        'agent',
        'tasks',
        { page, pageSize, status: status ?? null, type: type ?? null, search: search ?? null },
      ] as const,
    inspections: (page = 1, pageSize = 20) => ['agent', 'inspections', { page, pageSize }] as const,
    verifications: (page = 1, pageSize = 20) =>
      ['agent', 'verifications', { page, pageSize }] as const,
    clients: (page = 1, pageSize = 20, status?: string) =>
      ['agent', 'clients', { page, pageSize, status: status ?? null }] as const,
    documents: (page = 1, pageSize = 20) => ['agent', 'documents', { page, pageSize }] as const,
    conversations: ['agent', 'conversations'] as const,
    messages: (conversationId: string) =>
      ['agent', 'conversations', conversationId, 'messages'] as const,
    reviews: (page = 1, pageSize = 20) => ['agent', 'reviews', { page, pageSize }] as const,
    reviewsSummary: ['agent', 'reviews', 'summary'] as const,
    sync: ['agent', 'sync'] as const,
    trustProfile: ['agent', 'trust-profile'] as const,
  },
  land: {
    list: (filters: Record<string, unknown>) => ['land', 'list', filters] as const,
    detail: (id: string) => ['land', 'detail', id] as const,
  },
  shortlets: {
    list: (filters: Record<string, unknown>) => ['shortlets', 'list', filters] as const,
    detail: (id: string) => ['shortlets', 'detail', id] as const,
    availability: (id: string, checkIn?: string, checkOut?: string) =>
      ['shortlets', 'availability', id, checkIn ?? null, checkOut ?? null] as const,
    reviews: (id: string) => ['shortlets', 'reviews', id] as const,
    bookings: (page = 1, pageSize = 20) => ['shortlets', 'bookings', { page, pageSize }] as const,
    wishlist: ['shortlets', 'wishlist'] as const,
    wishlistIds: ['shortlets', 'wishlist', 'ids'] as const,
  },
  buyer: {
    dashboard: ['buyer', 'dashboard'] as const,
    profile: ['buyer', 'profile'] as const,
    listings: (filters: Record<string, unknown>) => ['buyer', 'listings', filters] as const,
    recommendations: ['buyer', 'listings', 'recommendations'] as const,
    listingDetail: (id: string) => ['buyer', 'listings', id] as const,
    viewings: (page = 1, pageSize = 20) => ['buyer', 'viewings', { page, pageSize }] as const,
    saved: (page = 1, pageSize = 50) => ['buyer', 'saved', { page, pageSize }] as const,
    offers: (page = 1, pageSize = 20) => ['buyer', 'offers', { page, pageSize }] as const,
    offerThread: (id: string) => ['buyer', 'offers', id, 'thread'] as const,
    transactions: (page = 1, pageSize = 20) =>
      ['buyer', 'transactions', { page, pageSize }] as const,
    documents: (page = 1, pageSize = 30) => ['buyer', 'documents', { page, pageSize }] as const,
    conversations: ['buyer', 'conversations'] as const,
    messages: (conversationId: string) =>
      ['buyer', 'conversations', conversationId, 'messages'] as const,
    paymentMethod: ['buyer', 'settings', 'payment-method'] as const,
    notificationPreferences: ['buyer', 'settings', 'notifications'] as const,
    searchPreferences: ['buyer', 'settings', 'search-preferences'] as const,
    notifications: (page = 1, pageSize = 30) =>
      ['buyer', 'notifications', { page, pageSize }] as const,
    reviews: (page = 1, pageSize = 20) => ['buyer', 'reviews', { page, pageSize }] as const,
    trustProfile: ['buyer', 'trust-profile'] as const,
  },
  landlord: {
    dashboardStats: ['landlord', 'dashboard', 'stats'] as const,
    activity: ['landlord', 'dashboard', 'activity'] as const,
    revenueTrend: ['landlord', 'dashboard', 'revenue-trend'] as const,
    properties: (page = 1, pageSize = 20) =>
      ['landlord', 'properties', { page, pageSize }] as const,
    units: (propertyId: string) => ['landlord', 'units', propertyId] as const,
    tenants: (page = 1, pageSize = 20) => ['landlord', 'tenants', { page, pageSize }] as const,
    applications: (page = 1, pageSize = 20) =>
      ['landlord', 'applications', { page, pageSize }] as const,
    leases: (page = 1, pageSize = 20) => ['landlord', 'leases', { page, pageSize }] as const,
    maintenance: (page = 1, pageSize = 20) =>
      ['landlord', 'maintenance', { page, pageSize }] as const,
    maintenanceSummary: ['landlord', 'maintenance', 'summary'] as const,
    payments: (page = 1, pageSize = 20) => ['landlord', 'payments', { page, pageSize }] as const,
    paymentStats: ['landlord', 'payments', 'stats'] as const,
    arrearsSummary: ['landlord', 'payments', 'arrears-summary'] as const,
    financialsStats: ['landlord', 'financials', 'stats'] as const,
    financialsChart: ['landlord', 'financials', 'chart'] as const,
    expenses: (page = 1, pageSize = 20) => ['landlord', 'expenses', { page, pageSize }] as const,
    ownerStatements: (page = 1, pageSize = 20) =>
      ['landlord', 'owner-statements', { page, pageSize }] as const,
    listings: ['landlord', 'listings'] as const,
    leads: (page = 1, pageSize = 20) => ['landlord', 'leads', { page, pageSize }] as const,
    microsite: ['landlord', 'microsite'] as const,
    evictions: (page = 1, pageSize = 20) => ['landlord', 'evictions', { page, pageSize }] as const,
    reviewsSummary: ['landlord', 'reviews', 'summary'] as const,
    reviews: (page = 1, pageSize = 20) => ['landlord', 'reviews', { page, pageSize }] as const,
    documents: (page = 1, pageSize = 20, search?: string, category?: string) =>
      [
        'landlord',
        'documents',
        { page, pageSize, search: search ?? null, category: category ?? null },
      ] as const,
    notifications: ['landlord', 'notifications'] as const,
    vendors: (page = 1, pageSize = 20) => ['landlord', 'vendors', { page, pageSize }] as const,
    profile: ['landlord', 'profile'] as const,
    payout: ['landlord', 'settings', 'payout'] as const,
    automation: ['landlord', 'settings', 'automation'] as const,
    notificationPreferences: ['landlord', 'settings', 'notifications'] as const,
    conversations: ['landlord', 'messages', 'conversations'] as const,
  },
  resident: {
    household: ['resident', 'household'] as const,
    directory: ['resident', 'directory'] as const,
    announcements: (page = 1, pageSize = 20) =>
      ['resident', 'announcements', { page, pageSize }] as const,
    violations: ['resident', 'violations'] as const,
    deliveries: (page = 1, pageSize = 20) =>
      ['resident', 'deliveries', { page, pageSize }] as const,
    committee: ['resident', 'committee'] as const,
    polls: ['resident', 'polls'] as const,
    visitorPasses: ['resident', 'visitor-passes'] as const,
    amenities: ['resident', 'amenities'] as const,
    amenityBookings: ['resident', 'amenity-bookings'] as const,
    maintenance: ['resident', 'maintenance'] as const,
    dues: ['resident', 'dues'] as const,
    governance: ['resident', 'governance'] as const,
  },
} as const;
