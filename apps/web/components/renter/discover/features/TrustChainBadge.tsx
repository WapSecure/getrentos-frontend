import { Shield, ShieldCheck } from 'lucide-react';
import type { PropertyTrustChain } from '@/types/renter';

/**
 * Compact trust-chain badge for a browse card — the teaser for the full chain
 * on the property detail page. Shows "Verified" when every link holds, or an
 * "N/4 trust" count otherwise, with the per-link status in the hover title.
 *
 * Falls back to the legacy single "Verified" pill (property.isVerified) when the
 * payload carries no chain, so older listings are unaffected.
 */
export const TrustChainBadge = ({
  chain,
  fallbackVerified,
}: {
  chain?: PropertyTrustChain;
  fallbackVerified?: boolean;
}) => {
  if (!chain || chain.steps.length === 0) {
    if (!fallbackVerified) return null;
    return (
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">
        <Shield className="h-3 w-3" />
        <span>Verified</span>
      </div>
    );
  }

  const full = chain.metCount === chain.totalCount;
  const title = chain.steps.map((s) => `${s.met ? '✓' : '○'} ${s.label}`).join('\n');

  return (
    <div
      title={title}
      className={`absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        full ? 'bg-green-600 text-white' : 'bg-black/65 text-white'
      }`}
    >
      <ShieldCheck className="h-3 w-3" />
      <span>{full ? 'Verified' : `${chain.metCount}/${chain.totalCount} trust`}</span>
    </div>
  );
};
