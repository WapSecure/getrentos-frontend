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
  SUPER_ADMIN: 'admin',
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

export const IMPLEMENTED_PORTALS: readonly Portal[] = ['renter', 'resident'];
export const portalHref = (p: Portal) => `/(app)/(${p})` as const;

/* --------------------- signup role catalogue --------------------------- */

/** Roles a user can self-select at signup (admin / gateman / resident are provisioned out of band). */
export type SignupRoleId = 'renter' | 'landlord' | 'owner' | 'buyer' | 'realtor' | 'agent';

export interface SignupRole {
  id: SignupRoleId;
  name: string;
  tagline: string;
  /** lucide-react-native icon name */
  icon: 'Home' | 'Building2' | 'TrendingUp' | 'Search' | 'Users' | 'UserCheck';
}

export const SIGNUP_ROLES: SignupRole[] = [
  {
    id: 'renter',
    name: 'Renter',
    tagline: 'Find verified homes, apply digitally, pay rent securely.',
    icon: 'Home',
  },
  {
    id: 'landlord',
    name: 'Landlord',
    tagline: 'List properties, vet tenants, collect rent through escrow.',
    icon: 'Building2',
  },
  {
    id: 'owner',
    name: 'Property owner',
    tagline: 'List for sale, accept offers, track property value.',
    icon: 'TrendingUp',
  },
  {
    id: 'buyer',
    name: 'Property buyer',
    tagline: 'Save, compare, tour homes, make offers securely.',
    icon: 'Search',
  },
  {
    id: 'realtor',
    name: 'Realtor',
    tagline: 'Bring listings, schedule tours, negotiate on behalf.',
    icon: 'Users',
  },
  {
    id: 'agent',
    name: 'Agent',
    tagline: 'Operate on behalf with scoped, delegated permissions.',
    icon: 'UserCheck',
  },
];
