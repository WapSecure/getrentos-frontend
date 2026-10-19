/**
 * A land seller's authority to sell, as the API returns it
 * (src/modules/land/services/land-seller-authority.service.ts), with the words
 * every app uses for it. Web, backoffice and mobile share this so a claim
 * reads the same wherever it is shown.
 */

export const LAND_SELLER_CAPACITIES = [
  'REGISTERED_HOLDER',
  'CO_OWNER',
  'ATTORNEY',
  'ESTATE_ADMINISTRATOR',
  'COMPANY_DIRECTOR',
  'DEVELOPER',
  'FAMILY_REPRESENTATIVE',
  'COMMUNITY_REPRESENTATIVE',
] as const;
export type LandSellerCapacity = (typeof LAND_SELLER_CAPACITIES)[number];

export type LandAuthorityStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DISPUTED'
  | 'REVOKED';

export type LandSignatoryRole =
  | 'CO_OWNER'
  | 'PRINCIPAL'
  | 'CO_ADMINISTRATOR'
  | 'BENEFICIARY'
  | 'DIRECTOR'
  | 'FAMILY_PRINCIPAL'
  | 'COMMUNITY_LEADER'
  | 'THIRD_PARTY';

export type LandSignatoryConsent = 'PENDING' | 'CONSENTED' | 'OBJECTED' | 'WAIVED';

export const LAND_AUTHORITY_INSTRUMENTS = [
  'POWER_OF_ATTORNEY',
  'LETTERS_OF_ADMINISTRATION',
  'PROBATE',
  'COURT_ORDER',
  'BOARD_RESOLUTION',
  'DEVELOPMENT_AGREEMENT',
  'FAMILY_RESOLUTION',
  'COMMUNITY_RESOLUTION',
] as const;
export type LandAuthorityInstrument = (typeof LAND_AUTHORITY_INSTRUMENTS)[number];

export interface LandCapacityRule {
  label: string;
  instruments: LandAuthorityInstrument[];
  principalRequired: boolean;
  consentRoles: LandSignatoryRole[];
  minConsents: number | 'ALL';
  witnessRequired: boolean;
  legalInquiryRequired: boolean;
}

export interface LandAuthoritySignatory {
  id: string;
  role: LandSignatoryRole;
  fullName: string;
  consent: LandSignatoryConsent;
  respondedAt: string | null;
  /** Answered from their own GetRentos account. */
  answeredFromAccount: boolean;
  evidenceDocumentId: string | null;
  witnessName: string | null;
  objectionReason: string | null;
  checkedByStaff: boolean;
  waivedReason: string | null;
  /** Whether this consent counts towards the claim's requirements now. */
  counts: boolean;
}

export interface LandAuthorityClaim {
  id: string;
  propertyId: string;
  property: { title: string; city: string };
  capacity: LandSellerCapacity;
  capacityLabel: string;
  status: LandAuthorityStatus;
  claimant: { id: string; legalName: string };
  principalName: string | null;
  instrumentDocumentId: string | null;
  instrumentType: LandAuthorityInstrument | null;
  expiresAt: string | null;
  legalInquiry: { note: string | null; documentId: string | null; at: string } | null;
  submittedAt: string | null;
  decision: { by: string | null; at: string; note: string | null } | null;
  appeal: { note: string | null; at: string } | null;
  matrixVersion: string;
  signatories: LandAuthoritySignatory[];
}

/** A claim with what its capacity requires and what is still missing. */
export interface LandAuthorityView {
  authority: LandAuthorityClaim;
  requirements: LandCapacityRule;
  gaps: string[];
  matrixVersion: string;
  /** Every capacity's rules, so a seller changing capacity sees what it would need. */
  rules: Record<LandSellerCapacity, LandCapacityRule>;
}

/** Before any claim exists: the rules for every capacity, to choose from. */
export interface LandAuthorityEmptyView {
  authority: null;
  matrixVersion: string;
  rules: Record<LandSellerCapacity, LandCapacityRule>;
}

/** A consent request addressed to the signed-in account. */
export interface LandConsentRequest {
  signatoryId: string;
  role: LandSignatoryRole;
  consent: LandSignatoryConsent;
  respondedAt: string | null;
  seller: string;
  capacity: LandSellerCapacity;
  principalName: string | null;
  property: { id: string; title: string; city: string };
}

export const LAND_SELLER_CAPACITY_LABELS: Record<LandSellerCapacity, string> = {
  REGISTERED_HOLDER: 'I am the registered holder',
  CO_OWNER: 'I own it with others',
  ATTORNEY: 'I act under a power of attorney',
  ESTATE_ADMINISTRATOR: 'I administer an estate that owns it',
  COMPANY_DIRECTOR: 'I act for the company that owns it',
  DEVELOPER: 'I am the developer selling my allocation',
  FAMILY_REPRESENTATIVE: 'I represent the family that owns it',
  COMMUNITY_REPRESENTATIVE: 'I represent the community that owns it',
};

export const LAND_AUTHORITY_STATUS_LABELS: Record<LandAuthorityStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Under review',
  VERIFIED: 'Verified',
  REJECTED: 'Not accepted',
  DISPUTED: 'Disputed',
  REVOKED: 'Withdrawn',
};

export const LAND_SIGNATORY_ROLE_LABELS: Record<LandSignatoryRole, string> = {
  CO_OWNER: 'Co-owner',
  PRINCIPAL: 'Principal',
  CO_ADMINISTRATOR: 'Co-administrator',
  BENEFICIARY: 'Beneficiary',
  DIRECTOR: 'Director',
  FAMILY_PRINCIPAL: 'Family principal member',
  COMMUNITY_LEADER: 'Community leader',
  THIRD_PARTY: 'Objector',
};

export const LAND_CONSENT_LABELS: Record<LandSignatoryConsent, string> = {
  PENDING: 'Waiting',
  CONSENTED: 'Consented',
  OBJECTED: 'Objected',
  WAIVED: 'Set aside',
};

export const LAND_AUTHORITY_INSTRUMENT_LABELS: Record<LandAuthorityInstrument, string> = {
  POWER_OF_ATTORNEY: 'Power of attorney',
  LETTERS_OF_ADMINISTRATION: 'Letters of administration',
  PROBATE: 'Grant of probate',
  COURT_ORDER: 'Court order',
  BOARD_RESOLUTION: 'Board resolution',
  DEVELOPMENT_AGREEMENT: 'Development agreement',
  FAMILY_RESOLUTION: 'Family resolution',
  COMMUNITY_RESOLUTION: 'Community resolution',
};

export type LandAuthorityTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const landAuthorityTone = (status: LandAuthorityStatus): LandAuthorityTone =>
  status === 'VERIFIED'
    ? 'success'
    : status === 'DISPUTED' || status === 'REJECTED'
      ? 'danger'
      : status === 'PENDING_REVIEW'
        ? 'info'
        : status === 'DRAFT'
          ? 'warning'
          : 'neutral';

/** Roles a seller may list for a capacity: the ones its rule counts, then anyone else relevant. */
export const signatoryRolesFor = (rule: LandCapacityRule): LandSignatoryRole[] => {
  const extra: LandSignatoryRole[] = ['BENEFICIARY'];
  return [...rule.consentRoles, ...extra.filter((role) => !rule.consentRoles.includes(role))];
};

/** One sentence on what the capacity needs, for the seller choosing it. */
export const describeCapacityRule = (rule: LandCapacityRule): string => {
  const parts: string[] = [];
  if (rule.instruments.length) {
    parts.push(
      `a ${rule.instruments
        .map((i) => LAND_AUTHORITY_INSTRUMENT_LABELS[i].toLowerCase())
        .join(' or ')}`
    );
  }
  if (rule.consentRoles.length) {
    const who = LAND_SIGNATORY_ROLE_LABELS[rule.consentRoles[0]].toLowerCase();
    parts.push(
      rule.minConsents === 'ALL'
        ? `consent from every ${who}`
        : `consent from at least ${rule.minConsents} ${who}s besides you`
    );
  }
  if (rule.witnessRequired) parts.push('a witness to each consent given on paper');
  if (rule.legalInquiryRequired) parts.push('an independent legal inquiry by GetRentos');
  return parts.length
    ? `Needs ${parts.join(', ')}.`
    : 'Your title documents are enough; a reviewer confirms the name on them.';
};
