export const AUTH_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
  RESEND_OTP_DELAY_SECONDS: 30,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 50,
} as const;

/** Shared client-side validation patterns. Keep these centralized so every
 * authentication surface accepts the same input format. */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,6}[-\s.]?[0-9]{1,6}$/,
  DIGITS_ONLY: /^\d*$/,
  NON_DIGITS: /\D/g,
} as const;

export const SIGNUP_METHODS = {
  EMAIL: 'email',
  PHONE: 'phone',
} as const;

export type SignupMethod = (typeof SIGNUP_METHODS)[keyof typeof SIGNUP_METHODS];

export const ROLES = {
  RENTER: {
    id: 'renter',
    name: 'Renter',
    description: 'Search verified homes, apply digitally, pay rent securely.',
    icon: 'Home',
    requiresVerification: ['identity'],
    canAddLater: true,
    order: 1,
    dashboardRoute: '/renter/dashboard',
  },
  LANDLORD: {
    id: 'landlord',
    name: 'Landlord',
    description: 'List properties, vet tenants, collect rent through escrow.',
    icon: 'Building2',
    requiresVerification: ['identity', 'property'],
    canAddLater: true,
    order: 2,
    dashboardRoute: '/landlord/dashboard',
  },
  OWNER: {
    id: 'owner',
    name: 'Property Owner',
    description: 'List for sale, accept offers, track property value.',
    icon: 'TrendingUp',
    requiresVerification: ['identity', 'property'],
    canAddLater: true,
    order: 3,
    dashboardRoute: '/owner/dashboard',
  },
  BUYER: {
    id: 'buyer',
    name: 'Property Buyer',
    description: 'Save, compare, tour properties, make offers securely.',
    icon: 'Search',
    requiresVerification: ['identity'],
    canAddLater: true,
    order: 4,
    dashboardRoute: '/buyer/dashboard',
  },
  REALTOR: {
    id: 'realtor',
    name: 'Realtor',
    description: 'Bring listings, schedule tours, negotiate on behalf.',
    icon: 'Users',
    requiresVerification: ['identity', 'license'],
    canAddLater: true,
    order: 5,
    dashboardRoute: '/realtor/dashboard',
  },
  AGENT: {
    id: 'agent',
    name: 'Agent',
    description: 'Operate on behalf with scoped, delegated permissions.',
    icon: 'UserCheck',
    requiresVerification: ['identity'],
    canAddLater: true,
    order: 6,
    dashboardRoute: '/agent/dashboard',
  },
  ADMIN: {
    id: 'admin',
    name: 'Admin',
    description: 'Verify properties, resolve disputes, monitor fraud.',
    icon: 'Shield',
    requiresVerification: ['identity'],
    canAddLater: false,
    order: 7,
    dashboardRoute: '/admin/dashboard',
  },
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES]['id'];

// Roles that require identity + property/license verification before they can operate.
// Mirrors ROLES_REQUIRING_VERIFICATION in the backend's roles.constants.ts.
export const ROLES_REQUIRING_VERIFICATION = ['landlord', 'owner', 'realtor', 'agent'] as const;

export const VERIFICATION_TYPES = {
  IDENTITY: {
    id: 'identity',
    name: 'Identity Verification',
    description: 'Verify your identity with government ID and selfie',
    required: true,
  },
  PROPERTY: {
    id: 'property',
    name: 'Property Verification',
    description: 'Upload property documents to verify ownership',
    required: false,
  },
  LICENSE: {
    id: 'license',
    name: 'License Verification',
    description: 'Verify your real estate license',
    required: false,
  },
} as const;

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORD_TOO_SHORT: `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_OTP: 'Invalid verification code',
  OTP_EXPIRED: 'Verification code has expired. Please request a new one',
  USER_EXISTS: 'An account with this email/phone already exists',
  SOMETHING_WRONG: 'Something went wrong. Please try again',
} as const;

export const STORAGE_KEYS = {
  SIGNUP_DATA: 'getrentos_signup_data',
  AUTH_TOKEN: 'getrentos_auth_token',
  REFRESH_TOKEN: 'getrentos_refresh_token',
  USER: 'getrentos_user',
  SELECTED_ROLES: 'getrentos_selected_roles',
} as const;

// Main ROUTES constant
export const ROUTES = {
  // Public routes
  HOME: '/',
  SIGNUP: '/signup',
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  FORGOT_PASSWORD: '/forgot-password',
  ROLE_SELECTION: '/role-selection',
  VERIFICATION: '/verification',
  HOME_MANAGEMENT: '/home-management',

  // Dashboard base routes
  DASHBOARD: '/dashboard',

  // Role-specific dashboards
  RENTER_DASHBOARD: '/renter/dashboard',
  LANDLORD_DASHBOARD: '/landlord/dashboard',
  OWNER_DASHBOARD: '/owner/dashboard',
  BUYER_DASHBOARD: '/buyer/dashboard',
  REALTOR_DASHBOARD: '/realtor/dashboard',
  AGENT_DASHBOARD: '/agent/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',

  // Renter specific routes
  RENTER_DISCOVER: '/renter/discover',
  RENTER_SAVED: '/renter/saved',
  RENTER_APPLICATIONS: '/renter/applications',
  RENTER_LEASE: '/renter/lease',
  RENTER_PAYMENTS: '/renter/payments',
  RENTER_FINANCING: '/renter/financing',
  RENTER_MAINTENANCE: '/renter/maintenance',
  RENTER_MESSAGES: '/renter/messages',
  RENTER_DOCUMENTS: '/renter/documents',
  RENTER_SETTINGS: '/renter/settings',
  RENTER_TRUST_SCORE: '/renter/trust-score',
  RENTER_CREDIT_REPORT: '/renter/credit-report',
  RENTER_USSD_ACCESS: '/renter/ussd-access',
  RENTER_CALENDAR: '/renter/calendar',
  RENTER_ROOMMATES: '/renter/roommates',
  RENTER_NOTIFICATIONS: '/renter/notifications',
  RENTER_HELP: '/renter/help',
  RENTER_HOME: '/renter/home',

  // Landlord specific routes
  LANDLORD_PROPERTIES: '/landlord/properties',
  LANDLORD_UNITS: '/landlord/units',
  LANDLORD_LISTINGS: '/landlord/listings',
  LANDLORD_APPLICATIONS: '/landlord/applications',
  LANDLORD_TENANTS: '/landlord/tenants',
  LANDLORD_LEASES: '/landlord/leases',
  LANDLORD_PAYMENTS: '/landlord/payments',
  LANDLORD_MAINTENANCE: '/landlord/maintenance',
  LANDLORD_VENDORS: '/landlord/vendors',
  LANDLORD_FINANCIALS: '/landlord/financials',
  LANDLORD_OWNER_STATEMENTS: '/landlord/owner-statements',
  LANDLORD_ARREARS: '/landlord/arrears',
  LANDLORD_DOCUMENTS: '/landlord/documents',
  LANDLORD_MESSAGES: '/landlord/messages',
  LANDLORD_REVIEWS: '/landlord/reviews',
  LANDLORD_SETTINGS: '/landlord/settings',
  LANDLORD_REALTORS: '/landlord/realtors',
  LANDLORD_HELP: '/landlord/help',
  LANDLORD_HOME_MANAGEMENT: '/landlord/home-management',

  // Property Owner specific routes
  OWNER_PROPERTIES: '/owner/properties',
  OWNER_LISTINGS: '/owner/listings',
  OWNER_LEADS: '/owner/leads',
  OWNER_OFFERS: '/owner/offers',
  OWNER_TRANSACTIONS: '/owner/transactions',
  OWNER_ANALYTICS: '/owner/analytics',
  OWNER_DOCUMENTS: '/owner/documents',
  OWNER_MESSAGES: '/owner/messages',
  OWNER_REVIEWS: '/owner/reviews',
  OWNER_TRUST_PROFILE: '/owner/trust-profile',
  OWNER_SETTINGS: '/owner/settings',
  OWNER_REALTORS: '/owner/realtors',
  OWNER_HELP: '/owner/help',
  OWNER_HOME_MANAGEMENT: '/owner/home-management',

  // Buyer specific routes
  BUYER_DISCOVER: '/buyer/discover',
  BUYER_SAVED: '/buyer/saved',
  BUYER_VIEWINGS: '/buyer/viewings',
  BUYER_OFFERS: '/buyer/offers',
  BUYER_TRANSACTIONS: '/buyer/transactions',
  BUYER_DOCUMENTS: '/buyer/documents',
  BUYER_MESSAGES: '/buyer/messages',
  BUYER_REVIEWS: '/buyer/reviews',
  BUYER_TRUST_PROFILE: '/buyer/trust-profile',
  BUYER_SETTINGS: '/buyer/settings',
  BUYER_HELP: '/buyer/help',

  // Realtor specific routes
  REALTOR_CLIENTS: '/realtor/clients',
  REALTOR_LISTINGS: '/realtor/listings',
  REALTOR_LEADS: '/realtor/leads',
  REALTOR_VIEWINGS: '/realtor/viewings',
  REALTOR_OFFERS: '/realtor/offers',
  REALTOR_COMMISSIONS: '/realtor/commissions',
  REALTOR_DOCUMENTS: '/realtor/documents',
  REALTOR_MESSAGES: '/realtor/messages',
  REALTOR_REVIEWS: '/realtor/reviews',
  REALTOR_TRUST_PROFILE: '/realtor/trust-profile',
  REALTOR_SETTINGS: '/realtor/settings',
  REALTOR_HELP: '/realtor/help',

  // Agent specific routes
  AGENT_TASKS: '/agent/tasks',
  AGENT_INSPECTIONS: '/agent/inspections',
  AGENT_VERIFICATIONS: '/agent/verifications',
  AGENT_SYNC: '/agent/sync',
  AGENT_DOCUMENTS: '/agent/documents',
  AGENT_MESSAGES: '/agent/messages',
  AGENT_REVIEWS: '/agent/reviews',
  AGENT_TRUST_PROFILE: '/agent/trust-profile',
  AGENT_SETTINGS: '/agent/settings',
  AGENT_HELP: '/agent/help',

  // Admin / BackOffice specific routes
  ADMIN_USERS: '/admin/users',
  ADMIN_VERIFICATIONS: '/admin/verifications',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_FRAUD: '/admin/fraud',
  ADMIN_ESCROW: '/admin/escrow',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_DOCUMENTS: '/admin/documents',
  ADMIN_MESSAGES: '/admin/messages',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_ACCESS: '/admin/access',
  ADMIN_HELP: '/admin/help',
} as const;

export type Routes = (typeof ROUTES)[keyof typeof ROUTES];

// Dynamic routes need param interpolation, so they're helpers rather than plain constants.
export const buildRoute = {
  renterPropertyDetail: (id: string) => `/renter/properties/${id}`,
  renterPropertyApply: (id: string) => `/renter/properties/${id}/apply`,
};

export const SIGNIN_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_DURATION_HOURS: 24,
} as const;

export const SIGNIN_METHODS = {
  EMAIL: 'email',
  PHONE: 'phone',
  MAGIC_LINK: 'magic-link',
} as const;

export type SigninMethod = (typeof SIGNIN_METHODS)[keyof typeof SIGNIN_METHODS];

export const BACKEND_ROLE_TO_ID: Record<string, string> = {
  RENTER: 'renter',
  LANDLORD: 'landlord',
  PROPERTY_OWNER: 'owner',
  PROPERTY_BUYER: 'buyer',
  REALTOR: 'realtor',
  AGENT: 'agent',
  BACKOFFICE_ADMIN: 'admin',
  SUPER_ADMIN: 'admin',
  VERIFICATION_OFFICER: 'admin',
};

export const getDashboardRoute = (roleId: string): string => {
  const roleMap: Record<string, string> = {
    renter: ROUTES.RENTER_DASHBOARD,
    landlord: ROUTES.LANDLORD_DASHBOARD,
    owner: ROUTES.OWNER_DASHBOARD,
    buyer: ROUTES.BUYER_DASHBOARD,
    realtor: ROUTES.REALTOR_DASHBOARD,
    agent: ROUTES.AGENT_DASHBOARD,
    admin: ROUTES.ADMIN_DASHBOARD,
  };
  return roleMap[roleId] || ROUTES.DASHBOARD;
};

// Helper function to get role from stored user
export const getUserRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  const storedUser =
    localStorage.getItem(STORAGE_KEYS.USER) || sessionStorage.getItem(STORAGE_KEYS.USER);
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.role || 'renter';
    } catch {
      return null;
    }
  }
  return null;
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  );
};
