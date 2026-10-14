import { Clock, Shield, ShieldCheck } from 'lucide-react';
import { trustChainLabel } from '@getrentos/shared';
import type { PropertyTrustChain } from '@/types/renter';

/**
 * Compact trust-chain badge for a listing card — the teaser for the full chain
 * on the property detail page. Says in words where verification stands
 * ("Fully verified", "Verified · ownership pending", "Verification in
 * progress"), with the per-link status in the hover title.
 * Shared across the renter browse, public market and microsite cards.
 *
 * Absolutely positioned (top-left of the card image), so its parent needs a
 * positioning context. Falls back to the legacy single "Verified" pill when the
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

  const { label, tone } = trustChainLabel(chain);
  const title = chain.steps.map((s) => `${s.met ? '✓' : '○'} ${s.label}`).join('\n');
  const Icon = tone === 'pending' ? Clock : ShieldCheck;

  return (
    <div
      title={title}
      aria-label={`${label}. ${chain.steps.map((s) => `${s.label}: ${s.met ? 'done' : 'pending'}`).join(', ')}`}
      className={`absolute top-3 left-3 z-10 flex max-w-[calc(100%-4.5rem)] items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        tone === 'verified' ? 'bg-green-600 text-white' : 'bg-black/65 text-white'
      }`}
    >
      <Icon className={`h-3 w-3 shrink-0 ${tone === 'partial' ? 'text-green-400' : ''}`} />
      <span className="truncate">{label}</span>
    </div>
  );
};
