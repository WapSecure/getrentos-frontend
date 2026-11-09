import { trustChainLabel, type TrustChainLike } from '@sureground/shared';

export function withTrustLabel<T extends { trustChain?: TrustChainLike | null }>(listing: T) {
  return {
    ...listing,
    trustLabel: listing.trustChain?.steps.length ? trustChainLabel(listing.trustChain) : undefined,
  };
}
