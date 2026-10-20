'use client';

import { Gavel, Building2, Fingerprint } from 'lucide-react';
import { Badge, Button, Card, type BadgeVariant } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { TrustAppeal, TrustAppealStatus, TrustAppealTargetType } from '@/types/trust';

export const APPEAL_STATUS_META: Record<
  TrustAppealStatus,
  { label: string; variant: BadgeVariant }
> = {
  OPEN: { label: 'Open', variant: 'info' },
  UNDER_REVIEW: { label: 'Under review', variant: 'warning' },
  UPHELD: { label: 'Upheld', variant: 'danger' },
  OVERTURNED: { label: 'Overturned', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'neutral' },
};

export const APPEAL_TARGET_META: Record<
  TrustAppealTargetType,
  { label: string; icon: React.ElementType }
> = {
  PROPERTY_AUTHORITY: { label: 'Property authority claim', icon: Building2 },
  TRUST_VERIFICATION: { label: 'Identity / trust verification', icon: Fingerprint },
};

const shortId = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : '—');

interface AppealCardProps {
  appeal: TrustAppeal;
  delay?: number;
  onReview: () => void;
}

export const AppealCard = ({ appeal, delay, onReview }: AppealCardProps) => {
  const status = APPEAL_STATUS_META[appeal.status];
  const target = APPEAL_TARGET_META[appeal.targetType] ?? {
    label: appeal.targetType,
    icon: Gavel,
  };
  const TargetIcon = target.icon;

  return (
    <Card hover delay={delay} className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5 rounded-lg bg-accent p-2 text-primary shrink-0">
            <TargetIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{target.label}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {appeal.targetReference ?? appeal.targetLabel ?? `#${shortId(appeal.targetId)}`}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{appeal.reason}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-[11px] text-muted-foreground">
          Filed {formatDate(appeal.createdAt)} · by{' '}
          {appeal.subjectName ?? shortId(appeal.subjectUserId)}
        </span>
        <Button
          size="sm"
          variant="outline"
          icon={<Gavel className="h-3.5 w-3.5" />}
          onClick={onReview}
        >
          Review
        </Button>
      </div>
    </Card>
  );
};
