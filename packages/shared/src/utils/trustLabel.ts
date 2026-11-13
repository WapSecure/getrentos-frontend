// Payment protection is a platform guarantee, so the label turns only on the three checks that can
// be outstanding. A label says "Verified" only once the property link holds: a verified owner alone
// never makes a listing verified.
export type TrustLabelTone = 'verified' | 'partial' | 'pending';

export interface TrustChainLike {
  steps: { id: string; met: boolean }[];
}

const PENDING_NAME: Record<string, string> = {
  owner: 'owner ID pending',
  authority: 'ownership pending',
  property: 'property check pending',
};

export function trustChainLabel(chain: TrustChainLike): { label: string; tone: TrustLabelTone } {
  const outstanding = chain.steps.filter((s) => !s.met && s.id !== 'payment');
  if (outstanding.length === 0) return { label: 'Fully verified', tone: 'verified' };
  // The API caps the property link by the verification summary, so this is the one that decides.
  if (outstanding.some((s) => s.id === 'property')) {
    return { label: 'Verification in progress', tone: 'pending' };
  }
  if (outstanding.length === 1) {
    const name = PENDING_NAME[outstanding[0].id] ?? 'one check pending';
    return { label: `Verified · ${name}`, tone: 'partial' };
  }
  // A verified property whose owner ID and ownership are both still open is not yet a verified listing.
  return { label: 'Verification in progress', tone: 'pending' };
}

export interface ListingVerificationInput {
  trustChain?: TrustChainLike | null;
  /** The card flag some list endpoints still send; used only when there is no trust chain. */
  verified?: boolean | null;
  isVerified?: boolean | null;
  /** Land listings: the diligence case. CONDITIONAL is never verified, whatever the flag says. */
  diligence?: unknown;
  /** Sale and land detail routes: the investor-facing summary. CONDITIONALLY_APPROVED is never verified. */
  verificationSummary?: unknown;
}

/** Approved with conditions: the conditions are still outstanding, so it never counts as verified. */
const CONDITIONAL_STATUSES = new Set(['CONDITIONAL', 'CONDITIONALLY_APPROVED']);

/** The `status` of an API object, normalised; undefined when it has none (older APIs send raw shapes). */
const statusOf = (value: unknown): string | undefined => {
  const status =
    value && typeof value === 'object' ? (value as { status?: unknown }).status : undefined;
  return typeof status === 'string'
    ? status
        .trim()
        .toUpperCase()
        .replace(/[-\s]+/g, '_')
    : undefined;
};

export function conditionsOutstanding(listing: ListingVerificationInput): boolean {
  return [statusOf(listing.diligence), statusOf(listing.verificationSummary)].some(
    (status) => !!status && CONDITIONAL_STATUSES.has(status)
  );
}

export interface ListingVerification {
  /** The property itself passed Sureground's checks: the one test for a "Verified" badge. */
  verified: boolean;
  label: string;
  tone: TrustLabelTone;
}

/**
 * The listing badge every card on web and mobile shows. The trust chain is the source of truth, as
 * the API caps its property link by the verification summary; the bare flag is only a fallback.
 * Approval with conditions (land CONDITIONAL, summary CONDITIONALLY_APPROVED) is never verified.
 */
export function listingVerification(listing: ListingVerificationInput): ListingVerification {
  // Checked first: neither a stale chain nor the bare flag may turn conditional approval into "Verified".
  if (conditionsOutstanding(listing)) {
    return { verified: false, label: 'Approved with conditions', tone: 'pending' };
  }
  if (listing.trustChain?.steps.length) {
    const { label, tone } = trustChainLabel(listing.trustChain);
    return { verified: tone !== 'pending', label, tone };
  }
  return listing.verified || listing.isVerified
    ? { verified: true, label: 'Verified', tone: 'verified' }
    : { verified: false, label: 'Verification in progress', tone: 'pending' };
}

/** Shorthand for a card that shows a badge only when the listing is verified. */
export function isListingVerified(listing: ListingVerificationInput): boolean {
  return listingVerification(listing).verified;
}
