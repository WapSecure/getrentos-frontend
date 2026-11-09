import { Clock, Shield, ShieldCheck } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { trustChainLabel, type TrustLabelTone } from '@sureground/shared';
import type { PropertyTrustChain } from '@/types/renter';

export const TRUST_TONE_VARIANT: Record<TrustLabelTone, BadgeVariant> = {
  verified: 'success',
  partial: 'info',
  pending: 'neutral',
};

// Absolutely positioned, so its parent needs a positioning context.
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
      <div className="absolute top-3 left-3 z-10">
        <Badge variant="success" icon={<Shield className="h-3 w-3" />}>
          Verified
        </Badge>
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
      className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-4.5rem)]"
    >
      <Badge
        variant={TRUST_TONE_VARIANT[tone]}
        icon={<Icon className="h-3 w-3 shrink-0" />}
        className="max-w-full"
      >
        <span className="truncate">{label}</span>
      </Badge>
    </div>
  );
};
