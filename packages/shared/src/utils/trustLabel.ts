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
 */
export function listingVerification(listing: ListingVerificationInput): ListingVerification {
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
