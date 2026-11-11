import { normalizeLandDiligenceStatus } from '@sureground/shared';
import { Badge } from '@sureground/ui';
import { landDiligenceBadges } from '@/lib/statusBadge';

interface LandDiligenceBadgeProps {
  status?: string | null;
  className?: string;
}

export const LandDiligenceBadge = ({ status, className }: LandDiligenceBadgeProps) => {
  const { label, variant, icon: Icon } = landDiligenceBadges[normalizeLandDiligenceStatus(status)];

  return (
    <Badge variant={variant} icon={Icon && <Icon className="h-3.5 w-3.5" />} className={className}>
      {label}
    </Badge>
  );
};
