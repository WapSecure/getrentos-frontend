import { ROLES } from '@sureground/shared';
import type { BackendRole } from './api/auth';

// Mirrors the web app's role groups.
export type Portal =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate'
  /** Staff of a property-management firm: the agency workspace. */
  | 'manager'
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
  PROPERTY_MANAGER: 'manager',
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
  'manager',
  'realtor',
  'agent',
  'buyer',
  'renter',
  'resident',
  'gateman',
];

const CONSUMER_PORTALS: readonly Portal[] = ['buyer', 'renter', 'resident'];

export function portalsForRoles(roles: BackendRole[]): Portal[] {
  const set = new Set<Portal>();
  const consumerOrder: Portal[] = [];
  for (const r of roles) {
    const p = BACKEND_ROLE_TO_PORTAL[r];
    if (!p) continue;
    set.add(p);
    if (CONSUMER_PORTALS.includes(p) && !consumerOrder.includes(p)) consumerOrder.push(p);
  }
  const ranked = PORTAL_PRIORITY.filter((p) => set.has(p));
  const firstConsumer = ranked.findIndex((p) => CONSUMER_PORTALS.includes(p));
  if (firstConsumer === -1) return ranked;
  const others = ranked.filter((p) => !CONSUMER_PORTALS.includes(p));
  return [...others.slice(0, firstConsumer), ...consumerOrder, ...others.slice(firstConsumer)];
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
  'owner',
  'realtor',
  'estate',
  'manager',
];

// Routing on primaryPortal would strand a user whose most senior role has no screens yet.
// Returns null only when nothing they hold is built.
export function usablePortal(roles: BackendRole[], preferred?: Portal | null): Portal | null {
  const open = switchablePortals(roles);
  if (preferred && open.includes(preferred)) return preferred;
  return open[0] ?? null;
}

export function switchablePortals(roles: BackendRole[]): Portal[] {
  return portalsForRoles(roles).filter((p) => IMPLEMENTED_PORTALS.includes(p));
}

export const PORTAL_LABEL: Record<Portal, string> = {
  renter: 'Renting',
  landlord: 'Landlord',
  owner: 'Property owner',
  buyer: 'Buying',
  realtor: 'Realtor',
  agent: 'Field agent',
  estate: 'Estate manager',
  manager: 'Agency',
  gateman: 'Gate',
  resident: 'Resident',
  admin: 'Back office',
};
export const portalHref = (p: Portal) => `/(app)/(${p})` as const;

// Admin, gateman and resident are provisioned out of band, never offered at signup.
export type SignupRoleId =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate';

export type VerificationReq = 'identity' | 'property' | 'license';

export interface SignupRole {
  id: SignupRoleId;
  name: string;
  tagline: string;
  icon: 'Home' | 'Building2' | 'TrendingUp' | 'Search' | 'Users' | 'UserCheck' | 'Briefcase';
  requires: VerificationReq[];
}

export const VERIFICATION_LABEL: Record<VerificationReq, string> = {
  identity: 'Needs ID check',
  property: 'Needs property documents',
  license: 'Needs licence',
};

const SIGNUP_ROLE_IDS: readonly string[] = [
  'renter',
  'landlord',
  'owner',
  'buyer',
  'realtor',
  'agent',
  'estate',
] satisfies SignupRoleId[];

export const SIGNUP_ROLES: SignupRole[] = Object.values(ROLES)
  .filter((r) => SIGNUP_ROLE_IDS.includes(r.id))
  .sort((a, b) => a.order - b.order)
  .map((r) => ({
    id: r.id as SignupRoleId,
    name: r.name,
    tagline: r.description,
    icon: r.icon as SignupRole['icon'],
    requires: [...r.requiresVerification] as VerificationReq[],
  }));

export const REALTOR_VS_AGENT =
  'Realtors find clients and close deals. Agents act for one landlord or owner, with the permissions they give.';

/** Group segments are not in URLs, so open the screen in the user's own portal. Keep in step with app/(app)/(<portal>)/<screen>.tsx. */
const SHARED_TAB_SCREENS: Record<string, readonly Portal[]> = {
  discover: ['buyer', 'renter'],
  messages: ['agent', 'buyer', 'landlord', 'owner', 'realtor', 'renter'],
  account: [
    'agent',
    'buyer',
    'estate',
    'gateman',
    'landlord',
    'manager',
    'owner',
    'realtor',
    'renter',
    'resident',
  ],
};

export function samePortalScreenHref(portal: Portal, screen: string | undefined): string | null {
  if (!screen) return null;
  return SHARED_TAB_SCREENS[screen]?.includes(portal) ? `${portalHref(portal)}/${screen}` : null;
}
