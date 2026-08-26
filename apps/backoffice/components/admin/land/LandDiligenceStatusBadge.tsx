import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileClock,
  HelpCircle,
  type LucideIcon,
  XCircle,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import type { LandDiligenceStatus } from '@/types/land';

type StatusConfiguration = { label: string; variant: BadgeVariant; icon: LucideIcon };

const statusConfiguration: Record<LandDiligenceStatus, StatusConfiguration> = {
  NOT_STARTED: { label: 'Not started', variant: 'neutral', icon: FileClock },
  IN_REVIEW: { label: 'In review', variant: 'info', icon: Clock3 },
  ACTION_REQUIRED: { label: 'Action required', variant: 'warning', icon: HelpCircle },
  VERIFIED: { label: 'Verified', variant: 'success', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', variant: 'danger', icon: XCircle },
  EXPIRED: { label: 'Expired', variant: 'warning', icon: AlertCircle },
};

export function normalizeLandDiligenceStatus(
  value: string | undefined | null
): LandDiligenceStatus {
  const normalized = value
    ?.trim()
    .toUpperCase()
    .replace(/[-\s]+/g, '_') as LandDiligenceStatus;
  return normalized in statusConfiguration ? normalized : 'NOT_STARTED';
}

export const LandDiligenceStatusBadge = ({ status }: { status: string | undefined | null }) => {
  const config = statusConfiguration[normalizeLandDiligenceStatus(status)];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} icon={<Icon className="h-3 w-3" />}>
      {config.label}
    </Badge>
  );
};
