import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

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
  canManage: boolean;
  canTransact: boolean;
  note?: string | null;
  decisionNote?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  /** Shown instead of the UUID. */
  propertyReferenceCode?: string | null;
  /** On a `request()` response: true when this call filed/re-opened the claim, false when an identical one already existed. */
  justCreated?: boolean;
  /** Whether the publication gate would count this claim right now. */
  effective: boolean;
  /** Officer-approved but held for co-owner quorum: not all co-owners have countersigned. */
  awaitingCountersign?: boolean;
  countersignApproved?: number;
  /** Unanimous. */
  countersignRequired?: number;
}

export interface ResolvedPropertyRefDto {
  propertyId: string;
  referenceCode: string | null;
  title: string;
  address: string;
  city: string;
}

export interface ManagedPropertyDto {
  mandateId: string;
  propertyId: string;
  title: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  referenceCode?: string | null;
  ownerId: string;
  ownerName: string;
  relationship: string;
  status: AuthorityStatus;
  canList: boolean;
  canManage: boolean;
  canTransact: boolean;
  listingCount: number;
  archived: boolean;
  isVerified: boolean;
  verificationStatus: string;
  expiresAt?: string | null;
  grantedAt: string;
}

export const propertyAuthorityService = {
  async mine(): Promise<ApiResponse<PropertyAuthorityDto[]>> {
    return safeCall(() => authFetch<PropertyAuthorityDto[]>('/property-authorities/mine'));
  },

  async managed(): Promise<ApiResponse<ManagedPropertyDto[]>> {
    return safeCall(() => authFetch<ManagedPropertyDto[]>('/property-authorities/managed'));
  },

  /** Co-owner quorum is unanimous. */
  async awaitingCountersignature(): Promise<ApiResponse<PropertyAuthorityDto[]>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityDto[]>('/property-authorities/awaiting-countersignature')
    );
  },

  async countersign(id: string): Promise<ApiResponse<PropertyAuthorityDto>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityDto>(`/property-authorities/${id}/countersign`, { method: 'POST' })
    );
  },

  /** One decline rejects the whole mandate (unanimous). */
  async declineCountersign(
    id: string,
    reason?: string
  ): Promise<ApiResponse<PropertyAuthorityDto>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityDto>(`/property-authorities/${id}/countersign/decline`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  /** 404 when nothing matches. */
  async resolve(ref: string): Promise<ApiResponse<ResolvedPropertyRefDto>> {
    return safeCall(() =>
      authFetch<ResolvedPropertyRefDto>(
        `/property-authorities/resolve?ref=${encodeURIComponent(ref)}`
      )
    );
  },

  /**
   * Confers nothing until an officer approves it. `propertyRef` is the shareable code or a raw
   * UUID; the backend resolves either.
   */
  async request(input: {
    propertyRef: string;
    relationship: AuthorityRelationship;
    note?: string;
  }): Promise<ApiResponse<PropertyAuthorityDto>> {
    return safeCall(() =>
      authFetch<PropertyAuthorityDto>('/property-authorities', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: input.propertyRef,
          relationship: input.relationship,
          note: input.note,
        }),
      })
    );
  },
};
