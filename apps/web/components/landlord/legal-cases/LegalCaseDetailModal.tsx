'use client';

import { useState } from 'react';
import { CalendarPlus, Landmark, Lock, Scale, ShieldAlert } from 'lucide-react';
import {
  Badge,
  Button,
  DatePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Field,
  Select,
  Textarea,
} from '@getrentos/ui';

import { formatDate } from '@/lib/format';
import { LegalCaseStatusBadge, OutcomeBadge } from './LegalCaseCard';
import type {
  EnforcementMethod,
  HearingOutcome,
  LegalCase,
  LegalCaseOutcome,
} from '@/types/legal-case';

/**
 * One case: what has happened, what is next, and what is blocked.
 *
 * The rules that shaped this view:
 *
 * - **Filing is blocked until the notices have run out**, and the block is shown
 *   as a sentence with the reason rather than as a disabled button. The refusal
 *   comes from the same ladder the notices page uses, so the two cannot disagree
 *   about whether a possession claim is ready.
 * - **An adjournment has to name the next date.** The form will not submit
 *   without one, because an adjournment with no next date is how a case goes
 *   quiet — nothing prompts anybody and it is found again months later.
 * - **Deciding asks what the decision was.** `DECIDED` is a statement about the
 *   merits, not a position in a workflow.
 * - **Enforcement is only offered after a decision.** Sending a bailiff before a
 *   court has decided anything is not enforcement.
 */

const OUTCOMES: { value: LegalCaseOutcome; label: string }[] = [
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
];

const ENFORCEMENT: { value: EnforcementMethod; label: string }[] = [
  { value: 'BAILIFF', label: 'Court bailiff' },
  { value: 'POLICE', label: 'Police assistance' },
  { value: 'NONE', label: 'Not needed — the other side complied' },
];

const HEARING_RESULTS: { value: HearingOutcome; label: string }[] = [
  { value: 'HEARD', label: 'Heard' },
  { value: 'ADJOURNED', label: 'Adjourned' },
  { value: 'NOT_REACHED', label: 'Not reached — the court ran out of time' },
  { value: 'DECIDED', label: 'Decided' },
];

export function LegalCaseDetailModal({
  legalCase,
  onOpenChange,
  isSubmitting,
  onFile,
  onScheduleHearing,
  onRecordHearing,
  onDecide,
  onEnforce,
  onClose,
  onWithdraw,
}: {
  legalCase: LegalCase | null;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onFile: (input: { court: string; suitNumber: string }) => void;
  onScheduleHearing: (input: { scheduledFor: string; purpose?: string }) => void;
  onRecordHearing: (input: {
    hearingId: string;
    heldAt: string;
    outcome: HearingOutcome;
    notes?: string;
    adjournNextFor?: string;
  }) => void;
  onDecide: (input: { outcome: LegalCaseOutcome; notes?: string; decidedAt?: string }) => void;
  onEnforce: (input: { method: EnforcementMethod; notes?: string; enforcedAt?: string }) => void;
  onClose: (notes?: string) => void;
  onWithdraw: () => void;
}) {
  const [court, setCourt] = useState('');
  const [suitNumber, setSuitNumber] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingPurpose, setHearingPurpose] = useState('');
  const [resultFor, setResultFor] = useState<string | null>(null);
  const [heldAt, setHeldAt] = useState('');
  const [hearingOutcome, setHearingOutcome] = useState<HearingOutcome>('HEARD');
  const [hearingNotes, setHearingNotes] = useState('');
  const [adjournNextFor, setAdjournNextFor] = useState('');
  const [decideOutcome, setDecideOutcome] = useState<LegalCaseOutcome | ''>('');
  const [decideNotes, setDecideNotes] = useState('');
  const [decideDate, setDecideDate] = useState('');
  const [enforcementMethod, setEnforcementMethod] = useState<EnforcementMethod>('BAILIFF');
  const [enforcementNotes, setEnforcementNotes] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  if (!legalCase) return null;

  const scheduled = legalCase.hearings.filter((hearing) => hearing.heldAt === null);
  const held = legalCase.hearings.filter((hearing) => hearing.heldAt !== null);
  const isDone = legalCase.status === 'CLOSED' || legalCase.status === 'WITHDRAWN';

  // The ladder is what decides this, and the server checks the same thing. Asking
  // it here is what lets the form explain the block instead of failing on submit.
  const fileBlocked = legalCase.ladderReadyToFile === false;
  const needsLease = legalCase.kind === 'EVICTION' && legalCase.leaseId === null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogTitle className="flex flex-wrap items-center gap-2">
          <Scale className="h-5 w-5 text-gray-400" aria-hidden />
          {legalCase.kindLabel}
          <LegalCaseStatusBadge status={legalCase.status} />
          <OutcomeBadge outcome={legalCase.outcome} />
        </DialogTitle>

        <div className="mt-4 space-y-5">
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-800">{legalCase.description}</p>
            <p className="mt-1 text-xs text-gray-500">
              {legalCase.property.address}, {legalCase.property.city}
              {legalCase.unitName && ` · ${legalCase.unitName}`}
              {legalCase.tenantName && ` · ${legalCase.tenantName}`}
            </p>
            {legalCase.court && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                <Landmark className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                {legalCase.court}
                {legalCase.suitNumber && ` · ${legalCase.suitNumber}`}
                {legalCase.filedAt && ` · filed ${formatDate(legalCase.filedAt)}`}
              </p>
            )}
          </div>

          {legalCase.outstanding.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-gray-900">Outstanding</h3>
              <ul className="mt-2 space-y-2">
                {legalCase.outstanding.map((item) => (
                  <li key={item.action} className="rounded-md border border-gray-200 p-3 text-xs">
                    <p className="font-medium text-gray-900">{item.action}</p>
                    <p className="mt-0.5 text-gray-600">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* --- Filing ------------------------------------------------------- */}
          {legalCase.status === 'OPEN' && (
            <section className="rounded-md border border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-900">File in court</h3>

              {needsLease ? (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <p>
                    This case names no tenancy, so there is no notice record to check. A possession
                    claim cannot be filed on it.
                  </p>
                </div>
              ) : fileBlocked ? (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <p>
                    The notice ladder is not finished. The notice to quit and the notice of the
                    owner&rsquo;s intention to recover must both be served and run out before a
                    possession claim can be filed — filing early is a common way to lose the case
                    outright. See the tenancy&apos;s notices.
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Every document the court issues carries a suit number, so both are needed for the
                  case to be recorded as filed rather than intended.
                </p>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Court" required>
                  <input
                    value={court}
                    onChange={(event) => setCourt(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Lagos High Court"
                  />
                </Field>
                <Field label="Suit number" required>
                  <input
                    value={suitNumber}
                    onChange={(event) => setSuitNumber(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="LD/1234/2026"
                  />
                </Field>
              </div>

              <Button
                className="mt-3"
                isLoading={isSubmitting}
                disabled={fileBlocked || needsLease || !court.trim() || !suitNumber.trim()}
                onClick={() => onFile({ court: court.trim(), suitNumber: suitNumber.trim() })}
              >
                Record as filed
              </Button>
            </section>
          )}

          {/* --- Hearings ----------------------------------------------------- */}
          {!isDone && legalCase.status !== 'OPEN' && (
            <section className="rounded-md border border-gray-200 p-3">
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <CalendarPlus className="h-4 w-4 text-gray-400" aria-hidden />
                Hearings
              </h3>

              {scheduled.length === 0 && held.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">Nothing on the calendar yet.</p>
              )}

              {scheduled.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {scheduled.map((hearing) => (
                    <li key={hearing.id} className="rounded-md bg-gray-50 p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm text-gray-900">
                            {formatDate(hearing.scheduledFor)}
                          </p>
                          {hearing.purpose && (
                            <p className="text-xs text-gray-500">{hearing.purpose}</p>
                          )}
                        </div>
                        <Button variant="ghost" onClick={() => setResultFor(hearing.id)}>
                          Record result
                        </Button>
                      </div>

                      {resultFor === hearing.id && (
                        <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                          <Field label="What happened" required>
                            <Select
                              ariaLabel="What happened"
                              value={hearingOutcome}
                              onValueChange={(value) => setHearingOutcome(value as HearingOutcome)}
                              options={HEARING_RESULTS}
                            />
                          </Field>
                          <Field label="Date it was held" required>
                            <DatePicker
                              value={heldAt}
                              onChange={setHeldAt}
                              max={new Date().toISOString().slice(0, 10)}
                            />
                          </Field>

                          {/*
                            Required by the server when adjourned, and required here
                            too, so the form cannot produce the gap it exists to
                            prevent.
                          */}
                          {hearingOutcome === 'ADJOURNED' && (
                            <Field
                              label="Adjourned to"
                              required
                              hint="An adjournment has to name the date it was adjourned to. Leaving it blank is how a case goes quiet — nothing prompts anybody, and it is found again months later."
                            >
                              <DatePicker value={adjournNextFor} onChange={setAdjournNextFor} />
                            </Field>
                          )}

                          <Field
                            label="Notes"
                            hint="What was said, who appeared, what was ordered."
                          >
                            <Textarea
                              value={hearingNotes}
                              onChange={(event) => setHearingNotes(event.target.value)}
                              rows={2}
                            />
                          </Field>

                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setResultFor(null)}>
                              Cancel
                            </Button>
                            <Button
                              isLoading={isSubmitting}
                              disabled={
                                !heldAt || (hearingOutcome === 'ADJOURNED' && !adjournNextFor)
                              }
                              onClick={() =>
                                onRecordHearing({
                                  hearingId: hearing.id,
                                  heldAt,
                                  outcome: hearingOutcome,
                                  ...(hearingNotes.trim() ? { notes: hearingNotes.trim() } : {}),
                                  ...(hearingOutcome === 'ADJOURNED' ? { adjournNextFor } : {}),
                                })
                              }
                            >
                              Record
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {held.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {held.map((hearing) => (
                    <li key={hearing.id} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-700">{formatDate(hearing.scheduledFor)}</span>
                      <Badge variant={hearing.outcome === 'ADJOURNED' ? 'warning' : 'success'}>
                        {hearing.outcome?.replace(/_/g, ' ').toLowerCase() ?? 'held'}
                      </Badge>
                      {hearing.notes && <span className="text-gray-500">{hearing.notes}</span>}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Put a sitting on the calendar">
                    <DatePicker value={hearingDate} onChange={setHearingDate} />
                  </Field>
                  <Field label="Purpose">
                    <input
                      value={hearingPurpose}
                      onChange={(event) => setHearingPurpose(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Hearing of the motion"
                    />
                  </Field>
                </div>
                <Button
                  className="mt-3"
                  variant="ghost"
                  isLoading={isSubmitting}
                  disabled={!hearingDate}
                  onClick={() =>
                    onScheduleHearing({
                      scheduledFor: hearingDate,
                      ...(hearingPurpose.trim() ? { purpose: hearingPurpose.trim() } : {}),
                    })
                  }
                >
                  Schedule hearing
                </Button>
              </div>
            </section>
          )}

          {/* --- Decision ----------------------------------------------------- */}
          {legalCase.status === 'FILED' && (
            <section className="rounded-md border border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-900">Record the decision</h3>
              <p className="mt-1 text-xs text-gray-500">
                A decided case has to say what the decision was — a status change alone would leave
                the record unable to answer the only question anybody asks of it.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Outcome" required>
                  <Select
                    ariaLabel="Outcome"
                    value={decideOutcome}
                    onValueChange={(value) => setDecideOutcome(value as LegalCaseOutcome)}
                    options={OUTCOMES}
                    placeholder="What the court decided"
                  />
                </Field>
                <Field label="Date decided" hint="Defaults to today.">
                  <DatePicker value={decideDate} onChange={setDecideDate} />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea
                  value={decideNotes}
                  onChange={(event) => setDecideNotes(event.target.value)}
                  rows={2}
                />
              </Field>
              <Button
                className="mt-3"
                isLoading={isSubmitting}
                disabled={!decideOutcome}
                onClick={() =>
                  onDecide({
                    outcome: decideOutcome as LegalCaseOutcome,
                    ...(decideNotes.trim() ? { notes: decideNotes.trim() } : {}),
                    ...(decideDate ? { decidedAt: decideDate } : {}),
                  })
                }
              >
                Record decision
              </Button>
            </section>
          )}

          {/* --- Enforcement --------------------------------------------------- */}
          {legalCase.status === 'DECIDED' && (
            <section className="rounded-md border border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-900">Enforcement</h3>
              {legalCase.outcomeAt && (
                <p className="mt-1 text-xs text-gray-500">
                  Decided {formatDate(legalCase.outcomeAt)}
                  {legalCase.outcomeNotes && ` — ${legalCase.outcomeNotes}`}
                </p>
              )}
              <div className="mt-3">
                <Field label="How the decision is being enforced" required>
                  <Select
                    ariaLabel="How the decision is being enforced"
                    value={enforcementMethod}
                    onValueChange={(value) => setEnforcementMethod(value as EnforcementMethod)}
                    options={ENFORCEMENT}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea
                  value={enforcementNotes}
                  onChange={(event) => setEnforcementNotes(event.target.value)}
                  rows={2}
                />
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  isLoading={isSubmitting}
                  onClick={() =>
                    onEnforce({
                      method: enforcementMethod,
                      ...(enforcementNotes.trim() ? { notes: enforcementNotes.trim() } : {}),
                    })
                  }
                >
                  Record enforcement
                </Button>
              </div>
            </section>
          )}

          {/* --- Closing ------------------------------------------------------- */}
          {!isDone && (
            <section className="rounded-md border border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-900">Finish</h3>
              <Field
                label="Closing note"
                hint="Optional. Not the same as withdrawing: closing means it finished, withdrawing means it was abandoned."
              >
                <Textarea
                  value={closeNotes}
                  onChange={(event) => setCloseNotes(event.target.value)}
                  rows={2}
                />
              </Field>
              <Button
                className="mt-3"
                isLoading={isSubmitting}
                onClick={() => onClose(closeNotes.trim() || undefined)}
              >
                Close case
              </Button>

              {/*
                Withdraw sits next to close on purpose, with the distinction
                spelled out: one finished, the other was abandoned, and the record
                reads differently depending on which happened.
              */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500">
                  Withdrawing instead records that the case was abandoned rather than finished. It
                  stops being evidence of anything.
                </p>
                <Button className="mt-2" variant="ghost" onClick={onWithdraw}>
                  Withdraw case
                </Button>
              </div>
            </section>
          )}

          {isDone && legalCase.closedAt && (
            <p className="text-xs text-gray-500">
              {legalCase.status === 'WITHDRAWN' ? 'Withdrawn' : 'Closed'} on{' '}
              {formatDate(legalCase.closedAt)}.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <DialogClose asChild>
              <Button variant="ghost">Done</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
