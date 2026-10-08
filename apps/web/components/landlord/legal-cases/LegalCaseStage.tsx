'use client';

import { cn } from '@/lib/cn';
import type { LegalCaseStatus } from '@/types/legal-case';

/**
 * Where a case is in its life, at a glance.
 *
 * The failure this fixes: the old list showed a status *word* per row, so
 * scanning twelve cases meant reading twelve words and holding the trajectory in
 * your head. A case is a thing that moves through stages, and the list should
 * show that shape rather than spell it.
 *
 * `WITHDRAWN` is deliberately not a stage — it is a way of leaving, not a place
 * on the way — so it renders as a single marked step rather than a position in
 * the sequence.
 */

const STAGES: { status: LegalCaseStatus; label: string }[] = [
  { status: 'OPEN', label: 'Opened' },
  { status: 'FILED', label: 'Filed' },
  { status: 'DECIDED', label: 'Decided' },
  { status: 'CLOSED', label: 'Closed' },
];

const indexOf = (status: LegalCaseStatus) => STAGES.findIndex((stage) => stage.status === status);

export function LegalCaseStage({
  status,
  variant = 'compact',
}: {
  status: LegalCaseStatus;
  variant?: 'compact' | 'full';
}) {
  if (status === 'WITHDRAWN') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" aria-hidden />
        Withdrawn
      </span>
    );
  }

  const current = indexOf(status);

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1.5" title={STAGES[current]?.label}>
        {STAGES.map((stage, index) => (
          <span
            key={stage.status}
            aria-hidden
            className={cn(
              'h-1.5 rounded-full transition-colors',
              index < current && 'w-1.5 bg-primary/40',
              index === current && 'w-4 bg-primary',
              index > current && 'w-1.5 bg-border'
            )}
          />
        ))}
        <span className="ml-1 text-xs font-medium text-foreground">{STAGES[current]?.label}</span>
      </span>
    );
  }

  return (
    <ol className="flex items-center gap-0">
      {STAGES.map((stage, index) => {
        const reached = index <= current;
        return (
          <li key={stage.status} className="flex items-center">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold',
                  reached
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground'
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  'text-xs',
                  index === current ? 'font-semibold text-foreground' : 'text-muted-foreground'
                )}
              >
                {stage.label}
              </span>
            </span>
            {index < STAGES.length - 1 && (
              <span
                aria-hidden
                className={cn('mx-3 h-px w-8', index < current ? 'bg-primary/50' : 'bg-border')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
