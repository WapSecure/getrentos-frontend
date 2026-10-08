'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Field,
  NumberInput,
  Select,
  Textarea,
} from '@getrentos/ui';

import type { NoticeKind, NoticeServiceMethod, TenancyNotice } from '@/types/tenancy-notice';
import type { UnconfiguredPeriod } from '@/types/tenancy-notice';

/**
 * Raising and serving a notice.
 *
 * Two things are load-bearing here rather than cosmetic:
 *
 * - **The service date is declared, not defaulted to today.** Whether a period
 *   runs from the day of service or the day after is interpretation and it
 *   varies, so the platform does not decide it silently. Pre-filling today would
 *   be a decision, so the field starts empty and says why.
 * - **The period that will apply is shown before submitting**, with its basis and
 *   a warning when the jurisdiction has none recorded. A firm should never learn
 *   that fact from a rejection after telling a tenant something.
 */

const KINDS: { value: NoticeKind; label: string; statutory: boolean }[] = [
  { value: 'ARREARS_REMINDER', label: 'Arrears reminder', statutory: false },
  { value: 'DEMAND_LETTER', label: 'Demand letter', statutory: false },
  { value: 'NOTICE_TO_QUIT', label: 'Notice to quit', statutory: true },
  {
    value: 'NOTICE_OF_INTENTION_TO_RECOVER',
    label: "Notice of the owner's intention to recover",
    statutory: true,
  },
  { value: 'COURT_SUMMONS', label: 'Court summons', statutory: false },
];

const SERVICE_METHODS: { value: NoticeServiceMethod; label: string }[] = [
  { value: 'HAND_DELIVERY', label: 'Hand delivery' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'POST', label: 'Post' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'OTHER', label: 'Other' },
];

const MIN_REASON = 10;

export function RaiseNoticeDialog({
  open,
  onOpenChange,
  leaseId,
  jurisdiction,
  nextKind,
  unconfigured,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId: string;
  jurisdiction: string;
  /** Only the step the ladder expects, so the dialog cannot offer a skipped one. */
  nextKind: NoticeKind | null;
  unconfigured: UnconfiguredPeriod[];
  isSubmitting: boolean;
  onSubmit: (input: {
    leaseId: string;
    kind: NoticeKind;
    reason: string;
    arrearsAmount?: number;
    manualDays?: number;
    manualBasis?: string;
  }) => void;
}) {
  const [kind, setKind] = useState<NoticeKind>(nextKind ?? 'ARREARS_REMINDER');
  const [reason, setReason] = useState('');
  const [arrears, setArrears] = useState('');
  const [manualDays, setManualDays] = useState('');
  const [manualBasis, setManualBasis] = useState('');

  const definition = KINDS.find((entry) => entry.value === kind);
  const missing = definition?.statutory
    ? unconfigured.find((entry) => entry.jurisdiction === jurisdiction && entry.kind === kind)
    : undefined;
  const usingManual = manualDays.trim().length > 0;

  const blockedByReason = reason.trim().length < MIN_REASON;
  const blockedByBasis = usingManual && manualBasis.trim().length < 10;
  const blockedByNoPeriod = Boolean(missing) && !usingManual;
  const canSubmit = !blockedByReason && !blockedByBasis && !blockedByNoPeriod;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Raise a notice
        </DialogTitle>

        <div className="mt-4 space-y-4">
          <Field
            label="Step"
            required
            hint="The ladder has to be walked in order, so only the next step is offered."
          >
            <Select
              ariaLabel="Step"
              value={kind}
              onValueChange={(value) => setKind(value as NoticeKind)}
              options={KINDS.map((entry) => ({
                value: entry.value,
                // A step with no recorded period is worth flagging before it is
                // chosen, not after it is rejected.
                label:
                  entry.statutory &&
                  unconfigured.some(
                    (u) => u.jurisdiction === jurisdiction && u.kind === entry.value
                  )
                    ? `${entry.label} — no period recorded`
                    : entry.label,
              }))}
            />
          </Field>

          {missing && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-warning/30 bg-warning-subtle p-3.5 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
              <div>
                <p className="font-medium">
                  No period is recorded for this step in {missing.jurisdiction}
                </p>
                <p className="mt-0.5 text-muted-foreground">{missing.basis}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Record it under Notice periods, or enter a number for this one notice below. This
                  platform does not supply a default, because a wrong number here looks procedurally
                  sound while invalidating the claim.
                </p>
              </div>
            </div>
          )}

          <Field label="What the tenant is being told" required>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Rent for the current quarter has not been received…"
            />
          </Field>
          {blockedByReason && reason.length > 0 && (
            <p className="text-xs text-destructive">
              At least {MIN_REASON} characters — this is preserved as the record of what was served.
            </p>
          )}

          {(kind === 'ARREARS_REMINDER' || kind === 'DEMAND_LETTER') && (
            <Field
              label="Arrears, in naira"
              hint="Whole naira. Left blank, the notice carries no amount."
            >
              <NumberInput value={arrears} onValueChange={setArrears} placeholder="600000" />
            </Field>
          )}

          <details className="rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Enter a period for this one notice only
            </summary>
            <div className="mt-3 space-y-3">
              <Field
                label="Days"
                hint="Recorded as the least certain source, because it was typed for this notice rather than configured."
              >
                <NumberInput value={manualDays} onValueChange={setManualDays} placeholder="90" />
              </Field>
              <Field
                label="Basis"
                required
                hint="Where the number came from. A number without one cannot be reviewed later."
              >
                <Textarea
                  value={manualBasis}
                  onChange={(event) => setManualBasis(event.target.value)}
                  rows={2}
                  placeholder="Counsel advised 30 days for this tenancy specifically, on the call of 12 Oct."
                />
              </Field>
            </div>
          </details>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              isLoading={isSubmitting}
              disabled={!canSubmit}
              onClick={() =>
                onSubmit({
                  leaseId,
                  kind,
                  reason: reason.trim(),
                  ...(arrears.trim() ? { arrearsAmount: Number(arrears) } : {}),
                  ...(usingManual
                    ? { manualDays: Number(manualDays), manualBasis: manualBasis.trim() }
                    : {}),
                })
              }
            >
              Raise notice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ServeNoticeDialog({
  notice,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: {
  notice: TenancyNotice | null;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (input: {
    serviceDate: string;
    serviceMethod: NoticeServiceMethod;
    evidenceNote?: string;
  }) => void;
}) {
  const [serviceDate, setServiceDate] = useState('');
  const [serviceMethod, setServiceMethod] = useState<NoticeServiceMethod>('HAND_DELIVERY');
  const [evidenceNote, setEvidenceNote] = useState('');

  const canSubmit = serviceDate.length > 0;

  return (
    <Dialog open={notice !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Record service
        </DialogTitle>

        {notice && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{notice.kindLabel}</p>
              <p className="mt-0.5">
                {notice.periodDays === null
                  ? 'This step runs for no set period, so serving it starts no countdown.'
                  : `This will run for ${notice.periodDays} days from the date you give, and `}
                {notice.periodDays !== null && (
                  <>
                    will be recorded as {notice.periodDays} days,{' '}
                    {notice.periodSource === 'MANUAL'
                      ? 'typed for this notice'
                      : notice.periodSource === 'FIRM_OVERRIDE'
                        ? 'from your own recorded period'
                        : 'from the reference table'}
                    .
                  </>
                )}
              </p>
            </div>

            <Field
              label="Date the period runs from"
              required
              hint="Declared, not assumed. Whether a period runs from the day of service or the day after is interpretation, so this platform will not choose for you — and this date is what the expiry is computed from."
            >
              <DatePicker
                value={serviceDate}
                onChange={setServiceDate}
                max={new Date().toISOString().slice(0, 10)}
              />
            </Field>

            <Field label="How it was delivered" required>
              <Select
                ariaLabel="How it was delivered"
                value={serviceMethod}
                onValueChange={(value) => setServiceMethod(value as NoticeServiceMethod)}
                options={SERVICE_METHODS}
              />
            </Field>

            <Field
              label="Proof of service"
              hint="Who accepted it, what was attached, where it was left. This is the field a court reads."
            >
              <Textarea
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
                rows={2}
                placeholder="Handed to the tenant, who signed a copy."
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                isLoading={isSubmitting}
                disabled={!canSubmit}
                onClick={() =>
                  onSubmit({
                    serviceDate,
                    serviceMethod,
                    ...(evidenceNote.trim() ? { evidenceNote: evidenceNote.trim() } : {}),
                  })
                }
              >
                Record service
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
