/**
 * Central query-key factory. Every `useQuery` key comes from here so cache
 * invalidation is precise and greppable.
 */
export const qk = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  security: ['me', 'security'] as const,
  representatives: {
    list: (kind: 'realtor' | 'agent') => ['representatives', kind] as const,
    assignable: (kind: 'realtor' | 'agent', id: string, search: string) =>
      ['representatives', kind, id, 'assignable', search] as const,
  },
  authority: {
    managed: ['property-authorities', 'managed'] as const,
    mine: ['property-authorities', 'mine'] as const,
  },
  estateAgreements: ['estate-agreements', 'mine'] as const,
  host: {
    listings: ['host', 'listings'] as const,
    bookings: (view: string) => ['host', 'bookings', view] as const,
    booking: (id: string) => ['host', 'booking', id] as const,
    listingBookings: (listingId: string) => ['host', 'listing', listingId, 'bookings'] as const,
    blocked: (listingId: string) => ['host', 'listing', listingId, 'blocked'] as const,
    seasons: (listingId: string) => ['host', 'listing', listingId, 'seasons'] as const,
    sync: (listingId: string) => ['host', 'listing', listingId, 'sync'] as const,
    conversations: ['host', 'conversations'] as const,
    earnings: ['host', 'earnings'] as const,
    fees: ['host', 'fees'] as const,
    views: ['host', 'views'] as const,
    payoutAccount: ['host', 'payout-account'] as const,
    payouts: ['host', 'payouts'] as const,
    payoutSummary: ['host', 'payout-summary'] as const,
    penalties: ['host', 'penalties'] as const,
    disputes: ['host', 'disputes'] as const,
    disputeMessages: (id: string) => ['host', 'dispute', id, 'messages'] as const,
    depositClaims: ['host', 'deposit-claims'] as const,
  },
  homeCare: {
    dashboard: ['home-care', 'dashboard'] as const,
    workOrders: (view: string) => ['home-care', 'work-orders', view] as const,
    workOrder: (id: string) => ['home-care', 'work-order', id] as const,
    quotes: (id: string) => ['home-care', 'work-order', id, 'quotes'] as const,
    invoices: (id: string) => ['home-care', 'work-order', id, 'invoices'] as const,
    vendors: ['home-care', 'vendors'] as const,
    units: (propertyId: string) => ['home-care', 'units', propertyId] as const,
    assets: (propertyId: string) => ['home-care', 'assets', propertyId] as const,
    plans: ['home-care', 'plans'] as const,
    sla: (propertyId: string) => ['home-care', 'sla', propertyId] as const,
    timeline: ['home-care', 'timeline'] as const,
  },
  billing: {
    mine: ['billing'] as const,
    pricing: ['me', 'subscription', 'pricing'] as const,
    invoices: ['billing', 'invoices'] as const,
  },
  estateManager: {
    estates: ['estate-manager', 'estates'] as const,
    selected: ['estate-manager', 'selected'] as const,
    /** Everything cached for one estate; invalidate this after a write. */
    estate: (estateId: string) => ['estate-manager', estateId] as const,
    dashboard: (estateId: string) => ['estate-manager', estateId, 'dashboard'] as const,
    duesTrend: (estateId: string) => ['estate-manager', estateId, 'dues-trend'] as const,
    households: (estateId: string, search = '', status = '') =>
      ['estate-manager', estateId, 'households', { search, status }] as const,
    household: (estateId: string, householdId: string) =>
      ['estate-manager', estateId, 'household', householdId] as const,
    dues: (estateId: string, status = 'all') =>
      ['estate-manager', estateId, 'dues', status] as const,
    householdDues: (estateId: string, householdId: string) =>
      ['estate-manager', estateId, 'dues', 'household', householdId] as const,
    attention: (estateId: string) => ['estate-manager', estateId, 'attention'] as const,
    announcements: (estateId: string) => ['estate-manager', estateId, 'announcements'] as const,
    incidents: (estateId: string) => ['estate-manager', estateId, 'incidents'] as const,
    maintenance: (estateId: string) => ['estate-manager', estateId, 'maintenance'] as const,
    violations: (estateId: string) => ['estate-manager', estateId, 'violations'] as const,
    activeMuster: (estateId: string) => ['estate-manager', estateId, 'muster', 'active'] as const,
    musters: (estateId: string) => ['estate-manager', estateId, 'muster', 'history'] as const,
    muster: (estateId: string, musterId: string) =>
      ['estate-manager', estateId, 'muster', musterId] as const,
    visitorPasses: (estateId: string, status = 'all') =>
      ['estate-manager', estateId, 'visitor-passes', status] as const,
    polls: (estateId: string) => ['estate-manager', estateId, 'polls'] as const,
    amenities: (estateId: string) => ['estate-manager', estateId, 'amenities'] as const,
    amenityBookings: (estateId: string) =>
      ['estate-manager', estateId, 'amenity-bookings'] as const,
    expectedToday: (estateId: string) => ['estate-manager', estateId, 'expected-today'] as const,
    watchlist: (estateId: string, status: string) =>
      ['estate-manager', estateId, 'watchlist', status] as const,
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
    /** One thread. Lives under `conversations` so invalidating the inbox refreshes it too. */
    conversation: (id: string) => ['renter', 'conversations', 'one', id] as const,
    viewings: ['renter', 'viewings'] as const,
    pendingLease: ['renter', 'lease', 'pending'] as const,
    renewalOffer: ['renter', 'lease', 'renewal-offer'] as const,
    receipts: ['renter', 'payments', 'receipts'] as const,
    profile: ['renter', 'profile'] as const,
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
    recentlyViewed: ['renter', 'recently-viewed'] as const,
    inspections: ['renter', 'inspections'] as const,
    referrals: ['referrals', 'summary'] as const,
    dataExport: ['renter', 'settings', 'data-export'] as const,
    paymentMethods: ['renter', 'payments', 'methods'] as const,
    preferences: ['renter', 'settings', 'preferences'] as const,
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
  /** The signed-out marketplace — public data only, safe to persist. */
  market: {
    list: (kind: string, filters: Record<string, unknown>) =>
      ['market', 'list', kind, filters] as const,
    detail: (kind: string, id: string) => ['market', 'detail', kind, id] as const,
    estates: (search?: string) => ['market', 'estates', search ?? null] as const,
    saved: ['market', 'saved'] as const,
  },
  realtor: {
    dashboard: ['realtor', 'dashboard'] as const,
    activity: ['realtor', 'activity'] as const,
    clients: ['realtor', 'clients'] as const,
    assigned: (relationshipId: string) =>
      ['realtor', 'clients', relationshipId, 'properties'] as const,
    listings: ['realtor', 'listings'] as const,
    leads: (status?: string, search?: string) =>
      ['realtor', 'leads', { status: status ?? null, search: search ?? null }] as const,
    lead: (id: string) => ['realtor', 'lead', id] as const,
    viewings: ['realtor', 'viewings'] as const,
    offers: ['realtor', 'offers'] as const,
    commissions: (status?: string) => ['realtor', 'commissions', status ?? 'all'] as const,
    trend: ['realtor', 'commissions', 'trend'] as const,
    payoutSummary: ['realtor', 'payout-summary'] as const,
    payoutAccount: ['realtor', 'payout-account'] as const,
    payouts: ['realtor', 'payouts'] as const,
    payout: (id: string) => ['realtor', 'payout', id] as const,
    conversations: ['realtor', 'conversations'] as const,
    messages: (id: string) => ['realtor', 'conversations', id, 'messages'] as const,
    documents: ['realtor', 'documents'] as const,
    reviews: ['realtor', 'reviews'] as const,
    reviewsSummary: ['realtor', 'reviews', 'summary'] as const,
    trustProfile: ['realtor', 'trust-profile'] as const,
    profile: ['realtor', 'profile'] as const,
    notifications: ['realtor', 'notifications'] as const,
    notificationPreferences: ['realtor', 'notification-preferences'] as const,
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
    /** Every booking the guest has (the stay screens read one from here). */
    myStays: ['shortlets', 'bookings', 'all'] as const,
    conversations: ['shortlets', 'conversations'] as const,
    disputes: ['shortlets', 'disputes'] as const,
    disputeMessages: (id: string) => ['shortlets', 'disputes', id, 'messages'] as const,
    depositClaims: ['shortlets', 'deposit-claims'] as const,
    reviewsOfMe: ['shortlets', 'reviews-of-me'] as const,
  },
  owner: {
    dashboard: ['owner', 'dashboard'] as const,
    properties: ['owner', 'properties'] as const,
    property: (id: string) => ['owner', 'properties', id] as const,
    listings: ['owner', 'listings'] as const,
    offers: ['owner', 'offers'] as const,
    offerThread: (id: string) => ['owner', 'offers', id, 'thread'] as const,
    transactions: ['owner', 'transactions'] as const,
    leads: ['owner', 'leads'] as const,
    documents: ['owner', 'documents'] as const,
    reviews: ['owner', 'reviews'] as const,
    ratingSummary: ['owner', 'reviews', 'summary'] as const,
    metrics: ['owner', 'metrics'] as const,
    trustProfile: ['owner', 'trust-profile'] as const,
    land: ['owner', 'land'] as const,
    portfolioTrend: ['owner', 'analytics', 'portfolio-trend'] as const,
    marketInsights: (city: string) => ['owner', 'analytics', 'market-insights', city] as const,
    profile: ['owner', 'profile'] as const,
    notifications: ['owner', 'notifications'] as const,
    notificationPreferences: ['owner', 'settings', 'notifications'] as const,
    preferences: ['owner', 'preferences'] as const,
    conversations: ['owner', 'conversations'] as const,
    messages: (id: string) => ['owner', 'conversations', id, 'messages'] as const,
  },
  seller: {
    payoutAccount: ['seller', 'payout-account'] as const,
    payouts: ['seller', 'payouts'] as const,
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
    vacantUnits: ['landlord', 'leases', 'vacant-units'] as const,
    conversationMessages: (id: string) =>
      ['landlord', 'messages', 'conversations', id, 'messages'] as const,
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
    expectedDeliveries: ['resident', 'deliveries', 'expected'] as const,
    committee: ['resident', 'committee'] as const,
    polls: ['resident', 'polls'] as const,
    visitorPasses: ['resident', 'visitor-passes'] as const,
    amenities: ['resident', 'amenities'] as const,
    amenityBookings: ['resident', 'amenity-bookings'] as const,
    maintenance: ['resident', 'maintenance'] as const,
    dues: ['resident', 'dues'] as const,
    governance: ['resident', 'governance'] as const,
    /**
     * The roll call this household is being asked to answer, or null.
     *
     * Shared by the banner on the resident home screen and the answer screen, so
     * answering on one cannot leave a stale banner on the other.
     */
    emergency: ['resident', 'emergency'] as const,
  },
  gateman: {
    /**
     * Prefix for the whole console. Used by the offline queue to refresh
     * everything a guard is looking at once queued writes finally land — the
     * "inside now" list and the vehicle and delivery logs all move at once.
     */
    all: ['gateman'] as const,
    /** The guard's own post; every other gateman key hangs off its estate id. */
    myEstate: ['gateman', 'estate'] as const,
    /** Every estate this guard can open, for the switcher. */
    myEstates: ['gateman', 'estates'] as const,
    gates: (estateId: string) => ['gateman', estateId, 'gates'] as const,
    households: (estateId: string) => ['gateman', estateId, 'households'] as const,
    /** Visitors currently on the estate — anyone CHECKED_IN, however long ago. */
    visitorsInside: (estateId: string) => ['gateman', estateId, 'inside'] as const,
    /**
     * Every gate-raised walk-in, whatever its state. One key, because the console
     * needs the whole story — waiting, approved, refused — from one snapshot.
     */
    walkIns: (estateId: string) => ['gateman', estateId, 'walk-ins'] as const,
    deliveries: (estateId: string) => ['gateman', estateId, 'deliveries'] as const,
    /**
     * Who is expected today, for the guard being asked at the barrier.
     *
     * No window in the key: the board is "now" by definition, so keying on an
     * instant would add a cache entry per render and reuse none of them.
     */
    expectedToday: (estateId: string) => ['gateman', estateId, 'expected-today'] as const,
    /**
     * The identity document recorded against one visitor's pass.
     *
     * Keyed by the pass, not just the estate: it is a single record about one
     * person, and reusing one estate-wide key would have every pass share a cache
     * entry and show the wrong document.
     */
    visitorIdCheck: (estateId: string, passId: string) =>
      ['gateman', estateId, 'id-check', passId] as const,
    vehicleLogs: (estateId: string) => ['gateman', estateId, 'vehicle-logs'] as const,
    incidents: (estateId: string) => ['gateman', estateId, 'incidents'] as const,
  },
} as const;
