'use client';

import { motion } from 'framer-motion';
import { Gavel, Building2, Fingerprint } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { cn, formatDate } from '@getrentos/shared';
import type { TrustAppeal, TrustAppealStatus, TrustAppealTargetType } from '@/types/trust';

export const APPEAL_STATUS_META: Record<
  TrustAppealStatus,
  { label: string; text: string; bg: string }
> = {
  OPEN: {
    label: 'Open',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  UNDER_REVIEW: {
    label: 'Under review',
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  UPHELD: {
    label: 'Upheld',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  OVERTURNED: {
    label: 'Overturned',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  CLOSED: { label: 'Closed', text: 'text-muted-foreground', bg: 'bg-secondary' },
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

export const AppealCard = ({ appeal, delay = 0, onReview }: AppealCardProps) => {
  const status = APPEAL_STATUS_META[appeal.status];
  const target = APPEAL_TARGET_META[appeal.targetType] ?? {
    label: appeal.targetType,
    icon: Gavel,
  };
  const TargetIcon = target.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
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
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            status.bg,
            status.text
          )}
        >
          {status.label}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{appeal.reason}</p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-[11px] text-muted-foreground">
          Filed {formatDate(appeal.createdAt)} · by{' '}
          {appeal.subjectName ?? shortId(appeal.subjectUserId)}
        </span>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onReview}>
          <Gavel className="h-3.5 w-3.5" />
          Review
        </Button>
      </div>
    </motion.div>
  );
};
