export const publicWebRoutes = ['/', '/rent', '/buy', '/pricing', '/login', '/signup'] as const;

export const personaRoutes = [
  {
    role: 'RENTER' as const,
    routes: ['/renter/dashboard', '/renter/discover', '/renter/applications', '/renter/payments'],
  },
  {
    role: 'LANDLORD' as const,
    routes: [
      '/landlord/dashboard',
      '/landlord/properties',
      '/landlord/applications',
      '/landlord/payments',
    ],
  },
  {
    role: 'OWNER' as const,
    routes: ['/owner/dashboard', '/owner/properties', '/owner/leads', '/owner/transactions'],
  },
  {
    role: 'REALTOR' as const,
    routes: ['/realtor/dashboard', '/realtor/listings', '/realtor/leads', '/realtor/commissions'],
  },
  {
    role: 'BUYER' as const,
    routes: ['/buyer/dashboard', '/buyer/discover', '/buyer/offers', '/buyer/transactions'],
  },
  {
    role: 'AGENT' as const,
    routes: ['/agent/dashboard', '/agent/tasks', '/agent/inspections', '/agent/work-orders'],
  },
  {
    role: 'PROPERTY_MANAGER' as const,
    routes: ['/agency/overview', '/agency/owners', '/agency/mandates', '/agency/team'],
  },
  {
    role: 'ESTATE' as const,
    routes: ['/estate/dashboard', '/estate/households', '/estate/dues', '/estate/maintenance'],
  },
  {
    role: 'RESIDENT' as const,
    routes: [
      '/resident/dashboard',
      '/resident/dues',
      '/resident/maintenance',
      '/resident/visitor-passes',
    ],
  },
  {
    role: 'GATEMAN' as const,
    routes: ['/gateman/verify', '/gateman/deliveries', '/gateman/vehicles', '/gateman/incidents'],
  },
] as const;

export const adminRoutes = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/rentals/listings',
  '/admin/rent-finance/payments',
  '/admin/rent-reconciliation',
  '/admin/payout-runs',
  '/admin/disputes',
  '/admin/land/purchases',
  '/admin/maintenance/work-orders',
  '/admin/settings',
] as const;
