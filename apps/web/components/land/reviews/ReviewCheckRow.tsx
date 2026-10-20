'use client';

import { useState } from 'react';
import { Badge, Button, Field, RadioGroup, type RadioOption, Textarea } from '@getrentos/ui';
import { FileCheck2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandDiligenceCheckStatus } from '@/types/land';
import type { LandReviewCheck, LandReviewDocument } from '@/types/landReviewer';
import { ReviewCheckEvidence, type ReviewEvidenceActions } from './ReviewCheckEvidence';
import { decisionProblem, hasCitedDocument } from './reviewRules';

const CHOICES: RadioOption<LandDiligenceCheckStatus>[] = [
  { value: 'PASSED', label: 'Pass', tone: 'success' },
  { value: 'FLAGGED', label: 'Flag', tone: 'destructive' },
  { value: 'NOT_APPLICABLE', label: 'N/A', tone: 'info' },
];

const STATUS_BADGE: Record<
  LandDiligenceCheckStatus,
  { label: string; variant: 'neutral' | 'success' | 'danger' | 'info' }
> = {
  PENDING: { label: 'Pending', variant: 'neutral' },
  PASSED: { label: 'Passed', variant: 'success' },
  FLAGGED: { label: 'Flagged', variant: 'danger' },
  NOT_APPLICABLE: { label: 'Not applicable', variant: 'info' },
};

/** One check on the reviewer's seat: Pass / Flag / N-A with a note. */
export const ReviewCheckRow = ({
  check,
  documents,
  editable,
  isSaving,
  onDecide,
  evidence,
}: {
  check: LandReviewCheck;
  documents: LandReviewDocument[];
  editable: boolean;
  isSaving: boolean;
  onDecide: (status: LandDiligenceCheckStatus, note: string) => void;
  /** Upload / cite / uncite on this seat; offered on document-backed checks. */
  evidence?: ReviewEvidenceActions;
}) => {
  const [status, setStatus] = useState<LandDiligenceCheckStatus | null>(
    check.status === 'PENDING' ? null : check.status
  );
  const [note, setNote] = useState(check.note ?? '');
  const problem = status ? decisionProblem(check, status, note, documents) : null;
  const changed =
    status !== null && (status !== check.status || note.trim() !== (check.note ?? '').trim());
  const badge = STATUS_BADGE[check.status];
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">{check.label}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[
              check.required ? 'Required' : 'Optional',
              check.requiresDocument
                ? hasCitedDocument(check, documents)
                  ? 'Document cited'
                  : 'Needs a cited document to pass'
                : null,
              check.decidedAt
                ? `Decided ${formatDate(check.decidedAt)}${check.decidedByMe ? ' by you' : ' by GetRentos'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {editable && check.requiresDocument && evidence && (
        <ReviewCheckEvidence check={check} documents={documents} actions={evidence} />
      )}

      {editable ? (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (status && !problem) onDecide(status, note);
          }}
        >
          <RadioGroup
            value={status ?? ''}
            onValueChange={setStatus}
            options={CHOICES}
            orientation="horizontal"
            aria-label={`Decision for ${check.label}`}
          />
          <Field
            label="Your note"
            required={status === 'FLAGGED' || (status === 'NOT_APPLICABLE' && check.required)}
            optionalLabel="(optional)"
          >
            <Textarea
              rows={2}
              maxLength={2000}
              showCount
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What you checked and what you found"
            />
          </Field>
          {problem && (
            <p className="text-xs text-destructive" role="status">
              {problem}
            </p>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!changed || !!problem || isSaving}
            isLoading={isSaving}
          >
            Save decision
          </Button>
        </form>
      ) : (
        check.note && (
          <p className="mt-2 flex gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground">
            <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            {check.note}
          </p>
        )
      )}
    </li>
  );
};
