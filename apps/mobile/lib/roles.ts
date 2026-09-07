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

/** Order used to pick a primary portal when an account holds several roles. */
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

/** Portals with a real mobile implementation. Others show a holding screen. */
export const IMPLEMENTED_PORTALS: readonly Portal[] = ['renter'];

export const portalHref = (p: Portal) => `/(app)/(${p})` as const;
