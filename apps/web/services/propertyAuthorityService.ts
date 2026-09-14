import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/**
 * Property authority — the holder's side.
 *
 * A mandate is what lets someone act for a property they do not own: a manager
 * runs the listing, a co-owner owns half of it, an agent markets it under
 * authority. Claims are filed by the holder and decided by an officer, so this
 * service covers both halves of that conversation (`request`, `mine`) and the
 * read model that makes the mandate usable (`managed`).
 */

/** Mirrors the backend's AUTHORITY_RELATIONSHIPS. */
export const AUTHORITY_RELATIONSHIPS = [
  'LEGAL_OWNER',
  'CO_OWNER',
  'BENEFICIAL_OWNER',
  'POWER_OF_ATTORNEY',
  'PROPERTY_MANAGER',
  'AGENT',
] as const;
export type AuthorityRelationship = (typeof AUTHORITY_RELATIONSHIPS)[number];

export const AUTHORITY_RELATIONSHIP_LABELS: Record<AuthorityRelationship, string> = {
  LEGAL_OWNER: 'Legal owner (on the title)',
  CO_OWNER: 'Co-owner',
  BENEFICIAL_OWNER: 'Beneficial owner',
  POWER_OF_ATTORNEY: 'Power of attorney',
  PROPERTY_MANAGER: 'Property manager',
  AGENT: 'Estate agent',
};

export type AuthorityStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | 'EXPIRED';

export interface PropertyAuthorityDto {
  id: string;
  propertyId: string;
  userId: string;
  userEmail?: string | null;
  relationship: string;
  status: AuthorityStatus;
  canList: boolean;
  canTransact: boolean;
  note?: string | null;
  decisionNote?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  /** Whether the publication gate would count this claim right now. */
  effective: boolean;
}

/** A property the caller may act for, with what the mandate permits. */
export interface ManagedPropertyDto {
  mandateId: string;
  propertyId: string;
  title: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  ownerId: string;
  ownerName: string;
  relationship: string;
  status: AuthorityStatus;
  canList: boolean;
  canTransact: boolean;
  listingCount: number;
  archived: boolean;
  isVerified: boolean;
  verificationStatus: string;
  expiresAt?: string | null;
  grantedAt: string;
}

export const propertyAuthorityService = {
  /** Claims this signed-in user has filed. */
  async mine(): Promise<ApiResponse<PropertyAuthorityDto[]>> {
    return safeCall(() => authFetch<PropertyAuthorityDto[]>('/property-authorities/mine'));
  },

  /** Properties the signed-in user may act for. */
  async managed(): Promise<ApiResponse<ManagedPropertyDto[]>> {
    return safeCall(() => authFetch<ManagedPropertyDto[]>('/property-authorities/managed'));
  },

  /**
   * Files a claim. It confers nothing until an officer approves it — the copy in
   * the UI says so, because a form that looks like it grants access would be a
   * lie to the person filling it in.
   */
  async request(input: {
    propertyId: string;
    relationship: AuthorityRelationship;
    note?: string;
  }): Promise<ApiResponse<PropertyAuthorityDto>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityDto>('/property-authorities', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  },
};
