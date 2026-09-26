import type { BackendRole } from './api/auth';

/** Portal ids, mirroring the web app's role groups. */
export type Portal =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate'
  | 'gateman'
  | 'resident'
  | 'admin';

const BACKEND_ROLE_TO_PORTAL: Record<string, Portal> = {
  RENTER: 'renter',
  LANDLORD: 'landlord',
  PROPERTY_OWNER: 'owner',
  PROPERTY_BUYER: 'buyer',
  REALTOR: 'realtor',
  AGENT: 'agent',
  ESTATE_MANAGER: 'estate',
  GATEMAN: 'gateman',
  RESIDENT: 'resident',
  BACKOFFICE_ADMIN: 'admin',
  VERIFICATION_OFFICER: 'admin',
  SUPER_ADMIN: 'admin',
  FRAUD_ANALYST: 'admin',
  DISPUTE_OFFICER: 'admin',
  ESCROW_OFFICER: 'admin',
  FINANCE_APPROVER: 'admin',
  COMPLIANCE_MANAGER: 'admin',
  SUPPORT_AGENT: 'admin',
};

const PORTAL_PRIORITY: Portal[] = [
  'admin',
  'estate',
  'landlord',
  'owner',
  'realtor',
  'agent',
  'buyer',
  'renter',
  'resident',
  'gateman',
];

export function portalsForRoles(roles: BackendRole[]): Portal[] {
  const set = new Set<Portal>();
  for (const r of roles) {
    const p = BACKEND_ROLE_TO_PORTAL[r];
    if (p) set.add(p);
  }
  return PORTAL_PRIORITY.filter((p) => set.has(p));
}

export function primaryPortal(roles: BackendRole[]): Portal {
  return portalsForRoles(roles)[0] ?? 'renter';
}

export const IMPLEMENTED_PORTALS: readonly Portal[] = [
  'renter',
  'resident',
  'agent',
  'buyer',
  'landlord',
  'gateman',
];

/**
 * The portal the app should actually open: the highest-priority portal the user
 * holds that is implemented.
 *
 * `primaryPortal` answers "who is this?" — but routing on it strands a user
 * whose most senior role has no screens yet, even when a lower-ranked role of
 * theirs is fully built. An AGENT who also manages an estate, or a REALTOR who
 * also guards a gate, used to land on the holding screen with no way forward.
 *
 * Returns `null` only when nothing they hold is built — the one case that
 * should show the holding screen.
 */
export function usablePortal(roles: BackendRole[]): Portal | null {
  // `portalsForRoles` already returns them in PORTAL_PRIORITY order, so the
  // first implemented entry is the most senior one that actually opens.
  return portalsForRoles(roles).find((p) => IMPLEMENTED_PORTALS.includes(p)) ?? null;
}
export const portalHref = (p: Portal) => `/(app)/(${p})` as const;

/* --------------------- signup role catalogue --------------------------- */

/** Roles a user can self-select at signup (admin / gateman / resident are provisioned out of band). */
export type SignupRoleId =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate';

/** What a role needs verified before its features unlock. */
export type VerificationReq = 'identity' | 'property' | 'license';

export interface SignupRole {
  id: SignupRoleId;
  name: string;
  tagline: string;
  /** lucide-react-native icon name */
  icon: 'Home' | 'Building2' | 'TrendingUp' | 'Search' | 'Users' | 'UserCheck' | 'Briefcase';
  requires: VerificationReq[];
}

export const VERIFICATION_LABEL: Record<VerificationReq, string> = {
  identity: 'ID verified',
  property: 'Property docs',
  license: 'License',
};

export const SIGNUP_ROLES: SignupRole[] = [
  {
    id: 'renter',
    name: 'Renter',
    tagline: 'Search verified homes, apply digitally, pay rent securely.',
    icon: 'Home',
    requires: ['identity'],
  },
  {
    id: 'landlord',
    name: 'Landlord',
    tagline: 'List properties, vet tenants, collect rent through escrow.',
    icon: 'Building2',
    requires: ['identity', 'property'],
  },
  {
    id: 'owner',
    name: 'Property owner',
    tagline: 'List for sale, accept offers, track property value.',
    icon: 'TrendingUp',
    requires: ['identity', 'property'],
  },
  {
    id: 'buyer',
    name: 'Property buyer',
    tagline: 'Save, compare, tour properties, make offers securely.',
    icon: 'Search',
    requires: ['identity'],
  },
  {
    id: 'realtor',
    name: 'Realtor',
    tagline: 'Bring listings, schedule tours, negotiate on behalf.',
    icon: 'Users',
    requires: ['identity', 'license'],
  },
  {
    id: 'agent',
    name: 'Agent',
    tagline: 'Operate on behalf with scoped, delegated permissions.',
    icon: 'UserCheck',
    requires: ['identity'],
  },
  {
    id: 'estate',
    name: 'Estate manager',
    tagline: 'Manage a gated community — households, dues, and access.',
    icon: 'Briefcase',
    requires: ['identity'],
  },
];
