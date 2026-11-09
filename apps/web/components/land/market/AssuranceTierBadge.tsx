import { Badge } from '@sureground/ui';
import { ShieldCheck } from 'lucide-react';
import { LAND_ASSURANCE_TIER_LABELS, type LandAssuranceTier } from '@/types/land';
import { LAND_ASSURANCE_TIER_DESCRIPTIONS } from '@/types/landMarket';

const isTier = (value: unknown): value is LandAssuranceTier =>
  value === 'BASIC' || value === 'STANDARD' || value === 'PREMIUM';

export const AssuranceTierBadge = ({
  tier,
  className,
}: {
  tier?: string | null;
  className?: string;
}) => {
  if (!isTier(tier)) return null;
  return (
    <span title={LAND_ASSURANCE_TIER_DESCRIPTIONS[tier]} className={className}>
      <Badge
        variant={tier === 'PREMIUM' ? 'success' : tier === 'STANDARD' ? 'info' : 'neutral'}
        icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}
      >
        <span className="sr-only">Assurance: </span>
        {LAND_ASSURANCE_TIER_LABELS[tier]}
      </Badge>
    </span>
  );
};
