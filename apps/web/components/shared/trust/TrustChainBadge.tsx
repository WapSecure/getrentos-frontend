import { Clock, Shield, ShieldCheck } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui/Badge';
import { trustChainLabel, type TrustLabelTone } from '@sureground/shared';
import type { PropertyTrustChain } from '@/types/renter';

export const TRUST_TONE_VARIANT: Record<TrustLabelTone, BadgeVariant> = {
  verified: 'success',
  partial: 'info',
  pending: 'neutral',
};

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
      <Badge variant="success" icon={<Shield className="h-3 w-3" />} className="shadow-xs">
        Verified
      </Badge>
    );
  }

  const { label, tone } = trustChainLabel(chain);
  const title = chain.steps.map((s) => `${s.met ? '✓' : '○'} ${s.label}`).join('\n');
  const Icon = tone === 'pending' ? Clock : ShieldCheck;

  return (
    <div
      title={title}
      aria-label={`${label}. ${chain.steps.map((s) => `${s.label}: ${s.met ? 'done' : 'pending'}`).join(', ')}`}
      className="flex min-w-0 max-w-full"
    >
      <Badge
        variant={TRUST_TONE_VARIANT[tone]}
        icon={<Icon className="h-3 w-3 shrink-0" />}
        className="max-w-full shadow-xs"
      >
        <span className="truncate">{label}</span>
      </Badge>
    </div>
  );
};
