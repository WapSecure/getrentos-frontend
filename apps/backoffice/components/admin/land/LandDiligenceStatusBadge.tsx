import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileClock,
  CircleDashed,
  HelpCircle,
  type SgIcon,
  PauseCircle,
  XCircle,
} from '@sureground/icons';
import {
  LAND_DILIGENCE_STATUS,
  normalizeLandDiligenceStatus,
  type LandDiligenceStatus,
} from '@sureground/shared';
import { Badge } from '@sureground/ui';

// Labels and colours are shared with web (@sureground/shared); only the icons are backoffice's.
const statusIcons: Record<LandDiligenceStatus, SgIcon> = {
  NOT_STARTED: FileClock,
  IN_REVIEW: Clock3,
  ACTION_REQUIRED: HelpCircle,
  VERIFIED: CheckCircle2,
  REJECTED: XCircle,
  EXPIRED: AlertCircle,
  CONDITIONAL: CircleDashed,
  SUSPENDED: PauseCircle,
};

export const LandDiligenceStatusBadge = ({ status }: { status: string | undefined | null }) => {
  const normalized = normalizeLandDiligenceStatus(status);
  const { label, tone } = LAND_DILIGENCE_STATUS[normalized];
  const Icon = statusIcons[normalized];

  return (
    <Badge variant={tone} icon={<Icon className="h-3 w-3" />}>
      {label}
    </Badge>
  );
};
