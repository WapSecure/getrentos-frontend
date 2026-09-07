'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, UserRoundSearch } from 'lucide-react';
import { formatDate, cn } from '@getrentos/shared';
import type { TrustReviewCaseSummary } from '@/types/trust';
import { REVIEW_CASE_PRIORITY_META, REVIEW_CASE_STATUS_META } from './trustMeta';

interface ReviewCaseCardProps {
  caseItem: TrustReviewCaseSummary;
  delay?: number;
  onReview: () => void;
}

export const ReviewCaseCard = ({ caseItem, delay = 0, onReview }: ReviewCaseCardProps) => {
  const statusMeta = REVIEW_CASE_STATUS_META[caseItem.status];
  const priorityMeta = REVIEW_CASE_PRIORITY_META[caseItem.priority];
  const verification = caseItem.verification;
  const subjectLabel = verification
    ? verification.subjectType === 'PERSON'
      ? 'Person'
      : verification.subjectType
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wide">Review case</span>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            statusMeta.bg,
            statusMeta.text
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', priorityMeta.dot)} />
          {statusMeta.label}
        </span>
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

      <div className="mt-auto pt-2 flex items-center justify-between border-t border-border">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize',
              priorityMeta.bg,
              priorityMeta.text
            )}
          >
            {priorityMeta.label}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(caseItem.createdAt)}</span>
        </div>
        <button
          onClick={onReview}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Review →
        </button>
      </div>
    </motion.div>
  );
};
