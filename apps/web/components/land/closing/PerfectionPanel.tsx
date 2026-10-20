'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, Send } from 'lucide-react';
import { Alert, Badge, Button, Input } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { LandPerfection, LandPerfectionStep } from '@/types/landClosing';

const STEP_BADGE: Record<
  LandPerfectionStep['status'],
  { label: string; variant: 'success' | 'info' | 'neutral' | 'danger' }
> = {
  NOT_STARTED: { label: 'Not started', variant: 'neutral' },
  SUBMITTED: { label: 'Submitted, awaiting approval', variant: 'info' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  NOT_APPLICABLE: { label: 'Not applicable', variant: 'neutral' },
};
const OWNER: Record<LandPerfectionStep['owner'], string> = {
  DEVELOPER: 'Developer',
  BUYER_LAWYER: "Buyer's lawyer",
  GETRENTOS: 'GetRentos',
};

/**
 * Title perfection after completion: each step's owner, due date, and its
 * submission and approval shown separately. The developer can record
 * progress; the buyer follows it.
 */
export const PerfectionPanel = ({
  perfection,
  role,
  busyKey,
  onUpdate,
}: {
  perfection: LandPerfection;
  role: 'buyer' | 'developer';
  busyKey?: string | null;
  onUpdate?: (key: string, status: 'SUBMITTED' | 'APPROVED', reference: string) => void;
}) => {
  const [editing, setEditing] = useState<{ key: string; status: 'SUBMITTED' | 'APPROVED' } | null>(
    null
  );
  const [reference, setReference] = useState('');

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            perfection.status === 'PERFECTED'
              ? 'success'
              : perfection.status === 'EXCEPTION'
                ? 'danger'
                : 'info'
          }
        >
          {perfection.status === 'PERFECTED'
            ? 'Title perfected'
            : perfection.status === 'EXCEPTION'
              ? 'Needs attention'
              : 'In progress'}
        </Badge>
        <span className="text-muted-foreground">
          {perfection.professionalName
            ? `Accountable professional: ${perfection.professionalName}${perfection.professionalFirm ? `, ${perfection.professionalFirm}` : ''}${perfection.professionalContact ? ` (${perfection.professionalContact})` : ''}`
            : 'Accountable professional not yet named'}
        </span>
      </div>

      {perfection.status === 'PERFECTED' && (
        <Alert variant="success">
          Registered in your name
          {perfection.perfectedAt ? ` on ${formatDate(perfection.perfectedAt)}` : ''}:{' '}
          <span className="font-medium">{perfection.finalInstrumentReference}</span>
        </Alert>
      )}

      <ul className="space-y-2">
        {perfection.steps.map((step) => {
          const badge = STEP_BADGE[step.status];
          const done = step.status === 'APPROVED' || step.status === 'NOT_APPLICABLE';
          return (
            <li key={step.key} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                  ) : step.escalationLevel > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-muted-foreground" aria-hidden />
                  )}
                  {step.label}
                </p>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {OWNER[step.owner]}
                {!done && step.dueDate ? ` · due ${formatDate(step.dueDate)}` : ''}
                {step.escalationLevel > 0 && !done ? ' · late' : ''}
                {step.submittedAt
                  ? ` · submitted ${formatDate(step.submittedAt)}${step.submissionReference ? ` (${step.submissionReference})` : ''}`
                  : ''}
                {step.approvedAt
                  ? ` · approved ${formatDate(step.approvedAt)}${step.approvalReference ? ` (${step.approvalReference})` : ''}`
                  : ''}
              </p>
              {step.note && <p className="mt-1 text-xs text-foreground">{step.note}</p>}

              {role === 'developer' &&
                onUpdate &&
                perfection.status !== 'PERFECTED' &&
                !done &&
                (editing?.key === step.key ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      maxLength={200}
                      placeholder={
                        editing.status === 'SUBMITTED'
                          ? 'File or application number'
                          : 'Approval, instrument or receipt number'
                      }
                    />
                    <Button
                      size="sm"
                      disabled={editing.status === 'APPROVED' && !reference.trim()}
                      isLoading={busyKey === step.key}
                      onClick={() => {
                        onUpdate(step.key, editing.status, reference.trim());
                        setEditing(null);
                        setReference('');
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {step.status !== 'SUBMITTED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Send className="h-4 w-4" />}
                        onClick={() => setEditing({ key: step.key, status: 'SUBMITTED' })}
                      >
                        Record submission
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() => setEditing({ key: step.key, status: 'APPROVED' })}
                    >
                      Record approval
                    </Button>
                  </div>
                ))}
            </li>
          );
        })}
      </ul>

      {perfection.status !== 'PERFECTED' && perfection.blockers.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Still to do
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
            {perfection.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      )}
      {role === 'buyer' && (
        <p className="text-xs text-muted-foreground">
          A step submitted to a government office is not approved until the approval is recorded.
          Your title is perfected only when every step is approved and the final registered
          instrument is on file.
        </p>
      )}
    </div>
  );
};
