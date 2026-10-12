'use client';

import { useState } from 'react';
import { CheckCircle2, ClipboardList, FileCheck2, FileWarning, Link2, Pencil } from 'lucide-react';
import { Badge, Button, Input, Select, type BadgeVariant } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { LandDiligenceCheck, LandDiligenceChecklistStatus } from '@/types/land';
import { checkDecisionProblem } from '@/lib/landDiligence';
import { LandCaseSection, PanelMessage } from './shared';

const statusOptions: { value: LandDiligenceChecklistStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable' },
];

const statusBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'neutral' },
  PASSED: { label: 'Passed', variant: 'success' },
  FLAGGED: { label: 'Flagged', variant: 'danger' },
  NOT_APPLICABLE: { label: 'Not applicable', variant: 'info' },
};

interface LandChecksPanelProps {
  checks: LandDiligenceCheck[];
  /** Checks can only be recorded while the case is in review or awaiting the owner. */
  editable: boolean;
  canReview: boolean;
  savingKey: string | null;
  /** Resolves true once saved, so a refused decision keeps the reviewer's draft. */
  onSave: (key: string, status: LandDiligenceChecklistStatus, note: string) => Promise<boolean>;
  onCite: (checkKey: string) => void;
}

/**
 * The structured checklist. Each check is decided on its own, against the
 * case version the reviewer loaded, and the screen enforces the same rules as
 * the API before sending: evidence first, and a reason for a flag or a
 * required check set aside.
 */
export const LandChecksPanel = ({
  checks,
  editable,
  canReview,
  savingKey,
  onSave,
  onCite,
}: LandChecksPanelProps) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<LandDiligenceChecklistStatus>('PENDING');
  const [draftNote, setDraftNote] = useState('');

  const passed = checks.filter((check) => check.status === 'PASSED').length;
  const requiredOpen = checks.filter(
    (check) => check.required && check.status !== 'PASSED' && check.status !== 'NOT_APPLICABLE'
  ).length;

  const startEditing = (check: LandDiligenceCheck) => {
    setEditingKey(check.key);
    setDraftStatus(check.status);
    setDraftNote(check.note ?? '');
  };

  return (
    <LandCaseSection
      title="Checklist"
      icon={ClipboardList}
      description={
        checks.length
          ? `${passed} of ${checks.length} passed · ${requiredOpen} required still open`
          : undefined
      }
    >
      {!editable && checks.length > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          Checks can only be changed while the case is in review or awaiting the owner.
        </p>
      )}
      {checks.length === 0 ? (
        <PanelMessage>
          This case has no structured checks yet. They are created when the owner submits the parcel
          for review.
        </PanelMessage>
      ) : (
        <ul className="space-y-2.5">
          {checks.map((check) => {
            const badge = statusBadge[check.status] ?? statusBadge.PENDING;
            const isEditing = editingKey === check.key;
            const problem = isEditing ? checkDecisionProblem(check, draftStatus, draftNote) : null;
            const unchanged =
              isEditing &&
              draftStatus === check.status &&
              draftNote.trim() === (check.note ?? '').trim();
            return (
              <li key={check.key} className="rounded-xl border border-border bg-secondary/25 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{check.label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {check.required && <Badge variant="warning">Required</Badge>}
                      {check.requiresDocument &&
                        (check.hasEvidence ? (
                          <Badge variant="success" icon={<FileCheck2 className="h-3 w-3" />}>
                            Evidence cited
                          </Badge>
                        ) : (
                          <Badge variant="neutral" icon={<FileWarning className="h-3 w-3" />}>
                            Needs evidence
                          </Badge>
                        ))}
                      {!check.requiresDocument && check.hasEvidence && (
                        <Badge variant="success" icon={<FileCheck2 className="h-3 w-3" />}>
                          Evidence cited
                        </Badge>
                      )}
                      <span className="text-muted-foreground">key: {check.key}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {canReview && editable && !isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onCite(check.key)}
                          icon={<Link2 className="h-3.5 w-3.5" />}
                        >
                          Cite document
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => startEditing(check)}
                          icon={<Pencil className="h-3.5 w-3.5" />}
                        >
                          Decide
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {(check.note || check.decidedByName) && !isEditing && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {check.note && (
                      <p className="whitespace-pre-wrap text-foreground">{check.note}</p>
                    )}
                    {check.decidedByName && (
                      <p className="mt-0.5">
                        Decided by {check.decidedByName}
                        {check.decidedAt && ` on ${formatDate(check.decidedAt)}`}
                      </p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="mt-3 space-y-2 rounded-lg bg-card p-3">
                    <div className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)]">
                      <Select
                        value={draftStatus}
                        onValueChange={(value) =>
                          setDraftStatus(value as LandDiligenceChecklistStatus)
                        }
                        options={statusOptions}
                        ariaLabel={`Decision for ${check.label}`}
                      />
                      <Input
                        value={draftNote}
                        maxLength={2000}
                        onChange={(event) => setDraftNote(event.target.value)}
                        placeholder={
                          draftStatus === 'FLAGGED' ||
                          (draftStatus === 'NOT_APPLICABLE' && check.required)
                            ? 'Why (required)'
                            : 'Note (optional)'
                        }
                        aria-label={`Note for ${check.label}`}
                      />
                    </div>
                    {problem && <p className="text-xs text-destructive">{problem}</p>}
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="xs" onClick={() => setEditingKey(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        disabled={Boolean(problem) || unchanged || savingKey !== null}
                        isLoading={savingKey === check.key}
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        onClick={async () => {
                          if (await onSave(check.key, draftStatus, draftNote.trim())) {
                            setEditingKey(null);
                          }
                        }}
                      >
                        Save decision
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </LandCaseSection>
  );
};
