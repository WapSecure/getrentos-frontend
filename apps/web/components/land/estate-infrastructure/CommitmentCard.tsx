'use client';

import type { ReactNode } from 'react';
import { Badge, Card } from '@getrentos/ui';
import { CalendarClock, FileCheck2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { EstateCommitment } from '@/types/landEstateInfrastructure';
import { CHANGE_KIND_LABELS, COMMITMENT_STATUS_LABELS, commitmentBadge } from './labels';

const ROLE_LABELS = { DEVELOPER: 'Developer', BUYER: 'Buyer', STAFF: 'GetRentos' } as const;

/**
 * One infrastructure promise, as every audience sees it: what, when, where it
 * stands, any pending change, and (when the viewer may see it) the timeline.
 * Actions for the viewer's role go in `children`.
 */
export const CommitmentCard = ({
  commitment,
  children,
}: {
  commitment: EstateCommitment;
  children?: ReactNode;
}) => {
  const badge = commitmentBadge(commitment);
  const change = commitment.openChange;
  return (
    <Card static className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {commitment.kindLabel}
          </p>
          <h3 className="mt-0.5 font-semibold text-foreground">{commitment.title}</h3>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{commitment.description}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {commitment.targetDate ? `Target ${formatDate(commitment.targetDate)}` : 'No target date'}
        </span>
        {commitment.verifiedAt ? (
          <span>Verified {formatDate(commitment.verifiedAt)}</span>
        ) : (
          commitment.deliveredAt && (
            <span>Reported delivered {formatDate(commitment.deliveredAt)}</span>
          )
        )}
        {commitment.evidenceCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden />
            {commitment.evidenceCount} evidence {commitment.evidenceCount === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>

      {change && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning-subtle p-3 text-sm">
          <p className="font-medium text-foreground">
            Proposed change: {CHANGE_KIND_LABELS[change.kind]}
          </p>
          {change.newTargetDate && (
            <p className="mt-1 text-foreground">New target: {formatDate(change.newTargetDate)}</p>
          )}
          {change.newDescription && (
            <p className="mt-1 text-foreground">Would deliver: {change.newDescription}</p>
          )}
          <p className="mt-1 text-muted-foreground">Why: {change.reason}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buyers can answer until {formatDate(change.respondBy)}.
            {change.acknowledged !== undefined &&
              ` ${change.acknowledged} acknowledged, ${change.objected ?? 0} objected.`}
          </p>
        </div>
      )}

      {commitment.updates && commitment.updates.length > 0 && (
        <ol className="mt-4 space-y-2 border-l border-border pl-4">
          {commitment.updates.map((update, index) => (
            <li key={`${update.at}-${index}`} className="text-sm">
              <p className="text-foreground">
                <span className="font-medium">{COMMITMENT_STATUS_LABELS[update.status]}</span>
                {' · '}
                {update.note}
              </p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[update.byRole]} {update.byName} · {formatDate(update.at)}
                {update.hasEvidence && ' · evidence attached'}
              </p>
            </li>
          ))}
        </ol>
      )}

      {children && <div className="mt-4 flex flex-wrap gap-2">{children}</div>}
    </Card>
  );
};
