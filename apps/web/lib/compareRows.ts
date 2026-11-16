import { trustChainLabel, type TrustChainLike, type TrustLabelTone } from '@sureground/shared';

/** Reads the trust chain like the browse card; the bare flag only when the API sends no chain. */
export function compareVerification(property: { trustChain?: TrustChainLike; verified: boolean }): {
  label: string;
  tone: TrustLabelTone;
} {
  if (property.trustChain) return trustChainLabel(property.trustChain);
  return property.verified
    ? { label: 'Property verified', tone: 'partial' }
    : { label: 'Not verified yet', tone: 'pending' };
}

export function compareRating(property: {
  rating: number;
  landlordReviews?: number;
}): string | null {
  const reviews = property.landlordReviews;
  if (reviews === 0 || !(property.rating > 0)) return null;
  const stars = property.rating.toFixed(1);
  return reviews ? `${stars} (${reviews} ${reviews === 1 ? 'review' : 'reviews'})` : stars;
}
