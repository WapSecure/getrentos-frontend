'use client';

import { ShieldCheck, UserRoundSearch } from 'lucide-react';
import { Badge, Button, Card, type BadgeVariant } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type {
  TrustReviewCasePriority,
  TrustReviewCaseStatus,
  TrustReviewCaseSummary,
} from '@/types/trust';
import { REVIEW_CASE_PRIORITY_META, REVIEW_CASE_STATUS_META } from './trustMeta';

const STATUS_VARIANT: Record<TrustReviewCaseStatus, BadgeVariant> = {
  OPEN: 'warning',
  ASSIGNED: 'info',
  ESCALATED: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const PRIORITY_VARIANT: Record<TrustReviewCasePriority, BadgeVariant> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

interface ReviewCaseCardProps {
  caseItem: TrustReviewCaseSummary;
  delay?: number;
  onReview: () => void;
}

export const ReviewCaseCard = ({ caseItem, delay, onReview }: ReviewCaseCardProps) => {
  const statusMeta = REVIEW_CASE_STATUS_META[caseItem.status];
  const priorityMeta = REVIEW_CASE_PRIORITY_META[caseItem.priority];
  const verification = caseItem.verification;
  const subjectLabel = verification
    ? verification.subjectType === 'PERSON'
      ? 'Person'
      : verification.subjectType
    : '—';

  return (
    <Card hover delay={delay} className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wide">Review case</span>
        </div>
        <Badge variant={STATUS_VARIANT[caseItem.status]}>{statusMeta.label}</Badge>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {verification?.purpose
            ? verification.purpose
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Manual verification'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <UserRoundSearch className="h-3.5 w-3.5" />
          {subjectLabel} · {verification?.subjectId ? verification.subjectId.slice(0, 8) : '—'}
          {verification?.status ? ` · ${verification.status}` : ''}
        </p>
      </div>

      {caseItem.reasonCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {caseItem.reasonCodes.map((code) => (
            <span
              key={code}
              className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {code}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        <div className="flex items-center gap-2">
          <Badge variant={PRIORITY_VARIANT[caseItem.priority]}>{priorityMeta.label}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(caseItem.createdAt)}</span>
        </div>
        <Button size="xs" variant="ghost" className="text-primary" onClick={onReview}>
          Review →
        </Button>
      </div>
    </Card>
  );
};
