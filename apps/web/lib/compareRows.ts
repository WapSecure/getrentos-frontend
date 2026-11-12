import { trustChainLabel, type TrustChainLike, type TrustLabelTone } from '@sureground/shared';

/**
 * The compare table's verification cell. It reads the trust chain, as the browse card and the listing
 * page do, so it can never say "verified" next to "verification in progress". The bare flag is only the
 * fallback for a listing the API sends no chain for.
 */
export function compareVerification(property: { trustChain?: TrustChainLike; verified: boolean }): {
  label: string;
  tone: TrustLabelTone;
} {
  if (property.trustChain) return trustChainLabel(property.trustChain);
  return property.verified
    ? { label: 'Property verified', tone: 'partial' }
    : { label: 'Not verified yet', tone: 'pending' };
}

/** The compare table's rating cell: a star rating only when there are reviews behind it; null means none. */
export function compareRating(property: {
  rating: number;
  landlordReviews?: number;
}): string | null {
  const reviews = property.landlordReviews;
  if (reviews === 0 || !(property.rating > 0)) return null;
  const stars = property.rating.toFixed(1);
  return reviews ? `${stars} (${reviews} ${reviews === 1 ? 'review' : 'reviews'})` : stars;
}
