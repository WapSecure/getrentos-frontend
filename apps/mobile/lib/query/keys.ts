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
} as const;
