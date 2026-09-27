import { apiFetch } from './client';

/**
 * Property authority, from the holder's side: the properties you may act for
 * because someone granted you a mandate, and the claims you've filed that an
 * officer hasn't decided yet. Shared by every portal that can hold a mandate.
 */
export const AUTHORITY_RELATIONSHIPS = [
  { value: 'PROPERTY_MANAGER', label: 'Property manager' },
  { value: 'CO_OWNER', label: 'Co-owner' },
  { value: 'LEGAL_OWNER', label: 'Legal owner (on the title)' },
  { value: 'BENEFICIAL_OWNER', label: 'Beneficial owner' },
  { value: 'POWER_OF_ATTORNEY', label: 'Power of attorney' },
  { value: 'AGENT', label: 'Estate agent' },
] as const;
export type AuthorityRelationship = (typeof AUTHORITY_RELATIONSHIPS)[number]['value'];
export type AuthorityStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | 'EXPIRED';

export const relationshipLabel = (r: string) =>
  AUTHORITY_RELATIONSHIPS.find((x) => x.value === r)?.label ?? r.toLowerCase().replace(/_/g, ' ');

export interface PropertyAuthority {
  id: string;
  propertyId: string;
  relationship: string;
  status: AuthorityStatus;
  decisionNote?: string | null;
  createdAt: string;
}

export interface ManagedProperty {
  mandateId: string;
  propertyId: string;
  title: string;
  address: string;
  city: string;
  ownerName: string;
  relationship: string;
  status: AuthorityStatus;
  canList: boolean;
  canManage: boolean;
  canTransact: boolean;
  listingCount: number;
  archived: boolean;
  expiresAt?: string | null;
}

export const propertyAuthorityApi = {
  managed: () => apiFetch<ManagedProperty[]>('/property-authorities/managed'),
  mine: () => apiFetch<PropertyAuthority[]>('/property-authorities/mine'),
  request: (input: { propertyId: string; relationship: AuthorityRelationship; note?: string }) =>
    apiFetch<PropertyAuthority>('/property-authorities', { method: 'POST', body: input }),
};

/**
 * The API answers a claim that already exists by returning it untouched, so
 * the message follows the status we got back rather than assuming "filed".
 */
export function claimOutcome(status: AuthorityStatus): string {
  if (status === 'ACTIVE') return 'You already act for this property — nothing new was filed.';
  if (status === 'PENDING') return 'You already have a claim on this property awaiting an officer.';
  return 'Claim filed. It grants nothing until an officer approves it.';
}
