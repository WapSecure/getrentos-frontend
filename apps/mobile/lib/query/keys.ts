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
  },
  listings: {
    /** Infinite list keyed by the active filter set. */
    search: (filters: Record<string, unknown>) => ['listings', 'search', filters] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
    saved: ['listings', 'saved'] as const,
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
