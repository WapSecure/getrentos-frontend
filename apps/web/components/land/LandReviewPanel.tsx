'use client';

import { Button } from '@getrentos/ui';
import { AlertTriangle, CheckCircle2, Circle, Clock3, Send, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandDiligenceCheck, OwnerLandRecord } from '@/types/land';
import { LAND_ASSURANCE_TIER_LABELS } from '@/types/land';
import { LandDiligenceBadge } from './LandDiligenceBadge';

interface LandReviewPanelProps {
  record: OwnerLandRecord;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const CHECK_ICON: Record<
  LandDiligenceCheck['status'],
  { icon: React.ElementType; className: string }
> = {
  PASSED: { icon: CheckCircle2, className: 'text-success' },
  FLAGGED: { icon: XCircle, className: 'text-destructive' },
  NOT_APPLICABLE: { icon: Circle, className: 'text-muted-foreground' },
  PENDING: { icon: Clock3, className: 'text-muted-foreground' },
};

/** What the owner is asked to do next, by diligence status. */
const PROMPT: Record<string, { title: string; body: string; action: string }> = {
  NOT_STARTED: {
    title: 'Submit for diligence review',
    body: 'Compliance checks the title at the registry, charts the survey and inspects the site before your land can be listed.',
    action: 'Submit for review',
  },
  ACTION_REQUIRED: {
    title: 'Compliance needs more from you',
    body: 'Address the findings below, update the parcel or documents, then resubmit.',
    action: 'Resubmit for review',
  },
  REJECTED: {
    title: 'Diligence was not passed',
    body: 'Fix the issues in the findings and resubmit when the records are corrected.',
    action: 'Resubmit for review',
  },
  EXPIRED: {
    title: 'Verification has expired',
    body: 'This parcel is off the market until its diligence is renewed. Resubmit current documents.',
    action: 'Renew verification',
  },
};

/**
 * Where a parcel stands in diligence and what it takes to move it on.
 *
 * Submission is an explicit step: saving the parcel no longer puts it in the
 * review queue. The backend says whether the parcel can be submitted and, if
 * not, why — those reasons are shown as a list rather than surfaced as an
 * error after the owner presses the button.
 */
export const LandReviewPanel = ({ record, isSubmitting, onSubmit }: LandReviewPanelProps) => {
  const diligence = record.diligence;
  const status = diligence?.status ?? 'NOT_STARTED';
  const prompt = PROMPT[status];
  const checks = diligence?.checks ?? [];
  const required = checks.filter((check) => check.required);
  const done = required.filter(
    (check) => check.status === 'PASSED' || check.status === 'NOT_APPLICABLE'
  );
  const { canSubmit, blockers } = record.submission;

  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Diligence review
          </p>
          <h2 className="mt-1 font-semibold text-foreground">
            {prompt?.title ??
              (status === 'IN_REVIEW'
                ? 'With compliance for review'
                : diligence?.assuranceTier
                  ? LAND_ASSURANCE_TIER_LABELS[diligence.assuranceTier]
                  : 'Verified')}
          </h2>
        </div>
        <LandDiligenceBadge status={status} />
      </div>

      {prompt && <p className="mt-2 text-sm text-muted-foreground">{prompt.body}</p>}

      {status === 'IN_REVIEW' && (
        <p className="mt-2 text-sm text-muted-foreground">
          {diligence?.submittedAt ? `Submitted ${formatDate(diligence.submittedAt)}. ` : ''}
          {diligence?.slaDueAt ? `Review expected by ${formatDate(diligence.slaDueAt)}.` : ''}
        </p>
      )}

      {status === 'VERIFIED' && diligence?.expiresAt && (
        <p className="mt-2 text-sm text-muted-foreground">
          Valid until {formatDate(diligence.expiresAt)}. We will remind you before it lapses.
        </p>
      )}

      {diligence?.findings && (status === 'ACTION_REQUIRED' || status === 'REJECTED') && (
        <div className="mt-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">
          <p className="font-medium">Findings from compliance</p>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{diligence.findings}</p>
        </div>
      )}

      {checks.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">
            {done.length} of {required.length} required checks complete
          </p>
          <ul className="mt-2 space-y-1.5">
            {checks.map((check) => {
              const { icon: Icon, className } = CHECK_ICON[check.status] ?? CHECK_ICON.PENDING;
              return (
                <li key={check.key} className="flex gap-2 text-sm">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
                  <span className="text-foreground">
                    {check.label}
                    {!check.required && <span className="text-muted-foreground"> (optional)</span>}
                    {check.status === 'FLAGGED' && check.note && (
                      <span className="block text-xs text-destructive">{check.note}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {prompt && (
        <div className="mt-4 border-t border-border pt-4">
          {!canSubmit && blockers.length > 0 && (
            <ul className="mb-3 space-y-1">
              {blockers.map((blocker) => (
                <li key={blocker} className="flex gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  {blocker}
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="primary"
            rounded="lg"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            onClick={onSubmit}
            icon={<Send className="h-4 w-4" />}
          >
            {prompt.action}
          </Button>
        </div>
      )}
    </section>
  );
};
