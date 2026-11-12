'use client';

import { useState, type ReactNode } from 'react';
import { Button, ConfirmDialog } from '@sureground/ui';

export type ReviewSubmissionState = 'locked' | 'open' | 'closed';

interface ReviewSubmissionSectionProps {
  id: string;
  title: string;
  /** locked until the conflict declaration, open while the seat is active, closed afterwards. */
  state: ReviewSubmissionState;
  /** The fields; shown only while open. */
  children: ReactNode;
  /** Shown above the fields while open, e.g. what was filed already. */
  intro?: ReactNode;
  /** Under the fields: limits, what is still missing. */
  hint?: ReactNode;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  confirm: { title: string; description: string };
  onSubmit: () => Promise<unknown>;
  /** What the seat filed, once closed. */
  closed: ReactNode;
}

/**
 * One way for a professional to file something on their seat (final report, valuation): a form that opens
 * after the conflict declaration, a confirmation before filing, and a read-only view once the seat is closed.
 */
export const ReviewSubmissionSection = ({
  id,
  title,
  state,
  children,
  intro,
  hint,
  canSubmit,
  isSubmitting,
  submitLabel,
  confirm,
  onSubmit,
  closed,
}: ReviewSubmissionSectionProps) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-3">
      <h2 id={`${id}-heading`} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      {state === 'locked' ? (
        <p className="text-sm text-muted-foreground">Opens after your declaration.</p>
      ) : state === 'open' ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setConfirming(true);
          }}
        >
          {intro}
          {children}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          <Button type="submit" disabled={!canSubmit || isSubmitting} isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </form>
      ) : (
        closed
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={submitLabel}
        isLoading={isSubmitting}
        onConfirm={() => onSubmit().catch(() => undefined)}
      />
    </section>
  );
};
