'use client';

import { useState, type ReactNode } from 'react';
import { Button, ConfirmDialog } from '@sureground/ui';

export type ReviewSubmissionState = 'locked' | 'open' | 'closed';

interface ReviewSubmissionSectionProps {
  id: string;
  title: string;
  state: ReviewSubmissionState;
  children: ReactNode;
  intro?: ReactNode;
  hint?: ReactNode;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  confirm: { title: string; description: string };
  onSubmit: () => Promise<unknown>;
  closed: ReactNode;
}

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
