'use client';

import { useState, type ReactNode } from 'react';
import { LockKeyhole, PenLine, ShieldCheck } from '@sureground/icons';
import { Alert, Button, ConfirmDialog, Field, Textarea } from '@sureground/ui';
import { PROPERTY_CHANGE_REQUEST_WARNING, describeLockedFields } from '@sureground/shared';

interface VerifiedDetailsLockProps {
  /** Fields the API refused, when a save ran into the lock. */
  lockedFields: string[] | null;
  changeMode: boolean;
  onStartChange: () => void;
  /** What the lock covers, e.g. "property name, address and map pin". */
  coverage: string;
  reason?: string;
  onReasonChange?: (reason: string) => void;
}

export function VerifiedDetailsLock({
  lockedFields,
  changeMode,
  onStartChange,
  coverage,
  reason,
  onReasonChange,
}: VerifiedDetailsLockProps) {
  const [confirming, setConfirming] = useState(false);

  if (changeMode) {
    return (
      <div className="space-y-3">
        <Alert variant="warning" title="Change request">
          Saving sends this property back for verification. {PROPERTY_CHANGE_REQUEST_WARNING}
        </Alert>
        {onReasonChange && (
          <Field label="What changed" optionalLabel="Optional" hint="Shown to the reviewer.">
            <Textarea
              value={reason ?? ''}
              maxLength={500}
              rows={2}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="For example: the estate renamed the street"
            />
          </Field>
        )}
      </div>
    );
  }

  return (
    <>
      <Alert
        variant={lockedFields ? 'warning' : 'info'}
        icon={lockedFields ? LockKeyhole : ShieldCheck}
        title={lockedFields ? 'These details are verified' : 'Verified details are locked'}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<PenLine className="h-3.5 w-3.5" />}
            onClick={() => setConfirming(true)}
          >
            Request change
          </Button>
        }
      >
        {lockedFields
          ? `This property is verified, so its ${describeLockedFields(lockedFields)} can't be edited directly. Your other changes were not saved yet.`
          : `We checked the ${coverage} when we verified this property, so they can't be edited directly.`}
      </Alert>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Request a change to verified details?"
        description={PROPERTY_CHANGE_REQUEST_WARNING}
        confirmLabel="Request change"
        tone="primary"
        onConfirm={() => {
          setConfirming(false);
          onStartChange();
        }}
      />
    </>
  );
}

interface VerifiedDetailsSummaryProps {
  rows: { label: string; value: ReactNode }[];
}

export function VerifiedDetailsSummary({ rows }: VerifiedDetailsSummaryProps) {
  return (
    <dl className="grid gap-3 rounded-xl border border-border bg-secondary/40 p-3 sm:grid-cols-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground [overflow-wrap:anywhere]">
            {value || <span className="text-muted-foreground">Not set</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
