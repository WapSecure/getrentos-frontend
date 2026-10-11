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
  viewingRequests: (status?: string) => ['landlord', 'viewingRequests', status ?? 'all'] as const,
  leases: (status?: string) => ['landlord', 'leases', status ?? 'all'] as const,
  inspections: (params?: { propertyId?: string; status?: string; type?: string }) =>
    [
      'landlord',
      'inspections',
      params?.propertyId ?? 'all',
      params?.status ?? 'all',
      params?.type ?? 'all',
    ] as const,
  inspection: (id: string) => ['landlord', 'inspections', 'detail', id] as const,
  deposits: (params?: { propertyId?: string; status?: string }) =>
    ['landlord', 'deposits', params?.propertyId ?? 'all', params?.status ?? 'all'] as const,
  deposit: (id: string) => ['landlord', 'deposits', 'detail', id] as const,
  tenants: ['landlord', 'tenants'] as const,
  payments: (status?: string) => ['landlord', 'payments', status ?? 'all'] as const,
  rentCollectionStats: ['landlord', 'rentCollectionStats'] as const,
  arrearsSummary: ['landlord', 'arrearsSummary'] as const,
  financialStats: (period: string) => ['landlord', 'financialStats', period] as const,
  financialChart: ['landlord', 'financialChart'] as const,
  portfolioAnalytics: ['landlord', 'portfolioAnalytics'] as const,
  expenses: (params?: { propertyId?: string; category?: string }) =>
    ['landlord', 'expenses', params?.propertyId ?? 'all', params?.category ?? 'all'] as const,
  managementFeeConfig: (propertyId: string) =>
    ['landlord', 'managementFeeConfig', propertyId] as const,
  ownerStatements: ['landlord', 'ownerStatements'] as const,
  ownerStatement: (id: string) => ['landlord', 'ownerStatements', id] as const,
  vendors: ['landlord', 'vendors'] as const,
  vendorDetail: (id: string) => ['landlord', 'vendors', 'detail', id] as const,
  maintenanceRequests: (params?: { status?: string; priority?: string }) =>
    [
      'landlord',
      'maintenanceRequests',
      params?.status ?? 'all',
      params?.priority ?? 'all',
    ] as const,
  maintenanceSummary: ['landlord', 'maintenanceSummary'] as const,
  /** Legal cases: recovery, injunction, title dispute, and eviction. */
  legalCases: ['landlord', 'legal-cases'] as const,
  legalCase: (id: string) => ['landlord', 'legal-cases', id] as const,
  outstandingLegalCases: ['landlord', 'legal-cases', 'outstanding'] as const,
  /** The notice ladder for one tenancy, and the period register behind it. */
  leaseLadder: (leaseId: string) => ['landlord', 'tenancy-notices', 'ladder', leaseId] as const,
  notices: ['landlord', 'tenancy-notices'] as const,
  noticePeriods: ['landlord', 'tenancy-notices', 'periods'] as const,
  leads: ['landlord', 'leads'] as const,
  offers: (status?: string) => ['landlord', 'offers', status ?? 'all'] as const,
  offerThread: (offerId: string) => ['landlord', 'offers', offerId, 'thread'] as const,
  micrositeSettings: ['landlord', 'microsite'] as const,
  reviews: ['landlord', 'reviews'] as const,
  reviewSummary: ['landlord', 'reviews', 'summary'] as const,
  conversations: ['landlord', 'conversations'] as const,
  conversationMessages: (conversationId: string) =>
    ['landlord', 'conversations', conversationId, 'messages'] as const,
  tenancyStanding: (applicationId: string) =>
    ['landlord', 'tenancyStanding', applicationId] as const,
  applicationScreening: (applicationId: string) =>
    ['landlord', 'applicationScreening', applicationId] as const,
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
  viewings: ['renter', 'viewings'] as const,
  allApplicationNotes: ['renter', 'applications', 'notes'] as const,
  applicationCreditCheck: (applicationId: string) =>
    ['renter', 'applications', applicationId, 'creditCheck'] as const,
  applicationNotes: (applicationId: string) =>
    ['renter', 'applications', applicationId, 'notes'] as const,
  roommates: ['renter', 'roommates'] as const,
  roommateExpenses: ['renter', 'roommateExpenses'] as const,
  /**
   * The renter's pending roommate invitations. Restored here: the roommates page
   * reads this key but dev no longer declared it, so the app did not typecheck.
   */
  roommateInvites: ['renter', 'roommateInvites'] as const,
  calendarEvents: ['renter', 'calendarEvents'] as const,
  trustScore: ['renter', 'trustScore'] as const,
  financing: ['renter', 'financing'] as const,
  documents: ['renter', 'documents'] as const,
  documentSummary: ['renter', 'documents', 'summary'] as const,
  conversations: ['renter', 'conversations'] as const,
  supportThreads: ['renter', 'support', 'threads'] as const,
  supportMessages: (id: string) => ['renter', 'support', 'threads', id, 'messages'] as const,
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
  payoutAccount: ['realtor', 'commissions', 'payout-account'] as const,
  payouts: ['realtor', 'commissions', 'payouts'] as const,
  payoutsSummary: ['realtor', 'commissions', 'payouts', 'summary'] as const,
  payoutDetail: (id: string) => ['realtor', 'commissions', 'payouts', id] as const,
  settingsProfile: ['realtor', 'settings', 'profile'] as const,
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
  settingsNotifications: ['agent', 'settings', 'notifications'] as const,
  notifications: ['agent', 'notifications'] as const,
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
  vendorPayoutAccount: (vendorId: string) =>
    ['home-management', 'vendors', vendorId, 'payout-account'] as const,
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
  hostSeasons: (listingId: string) => ['shortlets', 'host', listingId, 'seasons'] as const,
  hostCalendarSync: (listingId: string) =>
    ['shortlets', 'host', listingId, 'calendar-sync'] as const,
  guestMessages: ['shortlets', 'messages'] as const,
  hostMessages: ['shortlets', 'host', 'messages'] as const,
  hostPayouts: ['shortlets', 'host', 'payouts'] as const,
  hostFees: ['shortlets', 'host', 'fees'] as const,
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
  myEstates: ['estate', 'mine'] as const,
  // Estate marketplace
  inventory: (estateId: string) => ['estate', estateId, 'marketplace', 'inventory'] as const,
  agreements: (estateId: string, status?: string) =>
    ['estate', estateId, 'marketplace', 'agreements', status ?? 'all'] as const,
  estateListings: (estateId: string, listingType?: string, status?: string) =>
    ['estate', estateId, 'marketplace', 'listings', listingType ?? 'all', status ?? 'all'] as const,
  myAgreements: ['estate-agreements', 'mine'] as const,
  leads: (estateId: string, market?: string, stage?: string) =>
    ['estate', estateId, 'marketplace', 'leads', market ?? 'all', stage ?? 'all'] as const,
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
  deliveries: (estateId: string, filter?: string) =>
    ['estate', estateId, 'deliveries', filter ?? 'all'] as const,
  gates: (estateId: string) => ['estate', estateId, 'gates'] as const,
  watchlist: (estateId: string, filter?: string) =>
    ['estate', estateId, 'watchlist', filter ?? 'all'] as const,
  contractorPasses: (estateId: string, filter?: string) =>
    ['estate', estateId, 'contractor-passes', filter ?? 'all'] as const,
  /**
   * The roll call in progress, or null.
   *
   * Its own key rather than a filter on the list, because the console polls this
   * one during an emergency and the history can be a hundred rows long.
   */
  activeMuster: (estateId: string) => ['estate', estateId, 'emergency-musters', 'active'] as const,
  emergencyMusters: (estateId: string, filter?: string) =>
    ['estate', estateId, 'emergency-musters', 'list', filter ?? 'all'] as const,
  emergencyMuster: (estateId: string, musterId: string) =>
    ['estate', estateId, 'emergency-musters', musterId] as const,
  /**
   * Who is inside right now.
   *
   * One key, not one per read: the board is polled while somebody is watching
   * it, and keying on the instant it was taken would grow the cache by an entry
   * every refresh and never reuse one.
   */
  onSiteBoard: (estateId: string) => ['estate', estateId, 'dwell', 'on-site'] as const,
  authorisationDwell: (estateId: string, from?: string, to?: string, sort?: string) =>
    [
      'estate',
      estateId,
      'dwell',
      'authorisations',
      from ?? 'default',
      to ?? 'default',
      sort ?? 'dwell',
    ] as const,
  incidents: (estateId: string, status?: string) =>
    ['estate', estateId, 'incidents', status ?? 'all'] as const,
  /**
   * The checkpoint register, and the routes that walk it.
   *
   * Two keys rather than one, because the route planner's picker reads the
   * register and a new checkpoint must show up there without the routes being
   * refetched — they cannot change as a result of adding one.
   */
  /**
   * Who is coming today.
   *
   * One key, and it takes no window: the board is "now" by definition, so a key
   * that carried an instant would grow the cache an entry per render and reuse
   * none of them.
   */
  expectedToday: (estateId: string) => ['estate', estateId, 'expected-today'] as const,
  /**
   * The identity document recorded against ONE visitor's pass.
   *
   * Keyed by the pass, deliberately. An estate-wide key would have every pass in
   * the office's list share a cache entry, and the value carries a signed URL to
   * somebody's identity document — so the key is narrow enough that only the pass
   * the office actually asked about is ever fetched.
   */
  visitorIdCheck: (estateId: string, passId: string) =>
    ['estate', estateId, 'visitor-passes', passId, 'id-check'] as const,
  patrolCheckpoints: (estateId: string) => ['estate', estateId, 'patrol-checkpoints'] as const,
  patrolRoutes: (estateId: string) => ['estate', estateId, 'patrol-routes'] as const,
  /**
   * Which rounds were due and which nobody walked.
   *
   * The window is in the key because the report is a period, and keying only on
   * the estate would make switching period show the previous period's answer
   * until the new one arrived.
   */
  patrolReport: (estateId: string, from?: string, to?: string, routeId?: string) =>
    [
      'estate',
      estateId,
      'patrols',
      'rounds',
      from ?? 'default',
      to ?? 'default',
      routeId ?? 'all',
    ] as const,
  maintenanceTickets: (estateId: string, status?: string) =>
    ['estate', estateId, 'maintenanceTickets', status ?? 'all'] as const,
  polls: (estateId: string) => ['estate', estateId, 'polls'] as const,
  amenities: (estateId: string) => ['estate', estateId, 'amenities'] as const,
  amenityBookings: (estateId: string) => ['estate', estateId, 'amenityBookings'] as const,
  committee: (estateId: string) => ['estate', estateId, 'committee'] as const,
  microsite: (estateId: string) => ['estate', estateId, 'microsite'] as const,
  governanceVersions: (estateId: string, recordId: string) =>
    ['estate', estateId, 'governanceVersions', recordId] as const,
  governanceSignatures: (estateId: string, recordId: string) =>
    ['estate', estateId, 'governanceSignatures', recordId] as const,
  dashboardStats: (estateId: string) => ['estate', estateId, 'dashboardStats'] as const,
  duesTrend: (estateId: string) => ['estate', estateId, 'duesTrend'] as const,
  financialStats: (estateId: string, period: string) =>
    ['estate', estateId, 'financialStats', period] as const,
  financialChart: (estateId: string) => ['estate', estateId, 'financialChart'] as const,
  statements: (estateId: string) => ['estate', estateId, 'statements'] as const,
  statement: (estateId: string, id: string) => ['estate', estateId, 'statements', id] as const,
  payoutAccount: (estateId: string) => ['estate', estateId, 'payoutAccount'] as const,
};

export const estateResidentKeys = {
  myHousehold: ['estate', 'resident', 'household'] as const,
  dues: (status?: string) => ['estate', 'resident', 'dues', status ?? 'all'] as const,
  announcements: ['estate', 'resident', 'announcements'] as const,
  violations: ['estate', 'resident', 'violations'] as const,
  visitorPasses: (status?: string) =>
    ['estate', 'resident', 'visitorPasses', status ?? 'all'] as const,
  deliveries: (status?: string) => ['estate', 'resident', 'deliveries', status ?? 'all'] as const,
  expectedDeliveries: ['estate', 'resident', 'deliveries', 'expected'] as const,
  directory: ['estate', 'resident', 'directory'] as const,
  maintenanceTickets: ['estate', 'resident', 'maintenanceTickets'] as const,
  polls: ['estate', 'resident', 'polls'] as const,
  amenities: ['estate', 'resident', 'amenities'] as const,
  amenityBookings: ['estate', 'resident', 'amenityBookings'] as const,
  committee: ['estate', 'resident', 'committee'] as const,
  governance: ['estate', 'resident', 'governance'] as const,
  /**
   * The roll call this household is being asked to answer, or null.
   *
   * Shared by the banner on the dashboard and the answer screen, so a resident
   * who answers on one does not leave a stale banner on the other.
   */
  emergency: ['estate', 'resident', 'emergency'] as const,
};

/** Not persona-scoped — every signed-in user has at most one subscription. */
export const subscriptionKeys = {
  mine: ['subscription', 'mine'] as const,
  pricing: ['subscription', 'pricing'] as const,
};

/**
 * Property authority (not persona-scoped: a mandate is a fact about a property,
 * so the same cache entry serves the owner, agent and realtor portals).
 */
export const authorityKeys = {
  managed: ['property-authorities', 'managed'] as const,
  mine: ['property-authorities', 'mine'] as const,
};

/** Billing lifecycle state (status, trial/period end, cancellation). */
export const billingKeys = {
  mine: ['billing', 'mine'] as const,
  /** Payment history — the customer's receipts. */
  invoices: (page: number) => ['billing', 'invoices', page] as const,
};

/** Marketplace seller payouts — shared by Owner, Realtor and Agent. */
export const sellerPayoutKeys = {
  account: ['marketplace', 'seller', 'payout-account'] as const,
  payouts: ['marketplace', 'seller', 'payouts'] as const,
};

/**
 * Management mandates — the firm's side of the engagement.
 *
 * Separate from `authorityKeys` on purpose: the authority is "I may touch this
 * building", the mandate is "on whose instruction, and until when". A screen
 * needs both and they change for different reasons.
 */
export const mandateKeys = {
  /** Every mandate the caller manages. This is what feeds the client switcher. */
  managing: ['management-mandates', 'managing'] as const,
  /** Every mandate on properties the caller owns — the same engagement, other side. */
  mine: ['management-mandates', 'mine'] as const,
  one: (id: string) => ['management-mandates', id] as const,
  forProperty: (propertyId: string) => ['management-mandates', 'property', propertyId] as const,
  terminationRequests: (id: string) => ['management-mandates', id, 'termination-requests'] as const,
};
