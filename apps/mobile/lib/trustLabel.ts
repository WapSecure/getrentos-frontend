import { trustChainLabel, type TrustChainLike } from '@getrentos/shared';

/**
 * Adds the card's plain-words trust label from a listing's trust chain, so the
 * mobile cards say what the web cards say ("Verified · ownership pending")
 * instead of a blanket "Verified". Listings without a chain keep the old chip.
 */
export function withTrustLabel<T extends { trustChain?: TrustChainLike | null }>(listing: T) {
  return {
    ...listing,
    trustLabel: listing.trustChain?.steps.length ? trustChainLabel(listing.trustChain) : undefined,
  };
}
