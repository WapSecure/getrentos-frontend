'use client';

import { Alert, Button } from '@sureground/ui';
import { formatDate } from '@sureground/shared';
import { useAdminCan } from '@/hooks/useAdminCan';
import type { ListingWarning } from '@/types/admin';

/** The property cannot be approved while any of these is undecided; a fraud reviewer clears or upholds each one. */
export function ListingWarningsPanel({ warnings }: { warnings: ListingWarning[] }) {
  const canResolve = useAdminCan('fraud.review');
  if (!warnings.length) return null;
  const many = warnings.length > 1;

  return (
    <Alert
      variant="warning"
      title={
        many
          ? `${warnings.length} automated listing warnings need a decision`
          : 'An automated listing warning needs a decision'
      }
    >
      <p>
        Renters can see {many ? 'these warnings' : 'this warning'} on the listing. Approval is held
        until {many ? 'each one is' : 'it is'} cleared as a false alarm or upheld.
      </p>
      <ul className="mt-3 space-y-3">
        {warnings.map((warning) => (
          <li
            key={warning.reviewId}
            className="rounded-lg border border-border/70 bg-card p-3 text-foreground"
          >
            <p className="text-xs text-muted-foreground">
              Score {warning.score} of 100 · checked {formatDate(warning.scannedAt)}
            </p>
            {warning.reasons.length ? (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm">
                {warning.reasons.map((reason) => (
                  <li key={reason.code}>{reason.text}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm">The check gave no specific reasons.</p>
            )}
            {canResolve ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2.5"
                href={`/admin/fraud?warning=${encodeURIComponent(warning.reviewId)}`}
              >
                Resolve in the review queue
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {canResolve ? null : (
        <p className="mt-3">
          Ask a fraud reviewer to clear or uphold {many ? 'them' : 'it'} in the fraud review queue.
        </p>
      )}
    </Alert>
  );
}
