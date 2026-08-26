import { Badge } from '@getrentos/ui';
import { AlertTriangle, CheckCircle2, Clock3, FileSearch, XCircle } from 'lucide-react';
import { LAND_DILIGENCE_LABELS, type LandDiligenceStatus } from '@/types/land';

const STATUS_CONFIG: Record<
  LandDiligenceStatus,
  { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info'; icon: React.ElementType }
> = {
  NOT_STARTED: { variant: 'neutral', icon: Clock3 },
  IN_REVIEW: { variant: 'info', icon: FileSearch },
  ACTION_REQUIRED: { variant: 'warning', icon: AlertTriangle },
  VERIFIED: { variant: 'success', icon: CheckCircle2 },
  REJECTED: { variant: 'danger', icon: XCircle },
  EXPIRED: { variant: 'warning', icon: Clock3 },
};

interface LandDiligenceBadgeProps {
  status?: LandDiligenceStatus | string | null;
  className?: string;
}

export const LandDiligenceBadge = ({ status, className }: LandDiligenceBadgeProps) => {
  const normalized = (status ?? 'NOT_STARTED').toUpperCase() as LandDiligenceStatus;
  const config = STATUS_CONFIG[normalized] ?? STATUS_CONFIG.NOT_STARTED;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} icon={<Icon className="h-3.5 w-3.5" />} className={className}>
      {LAND_DILIGENCE_LABELS[normalized] ?? 'Not started'}
    </Badge>
  );
};
