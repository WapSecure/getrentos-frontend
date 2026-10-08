'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Gavel,
  Landmark,
  Lock,
  MoreVertical,
  ShieldAlert,
} from 'lucide-react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  Select,
  Textarea,
} from '@getrentos/ui';

import { formatDate } from '@/lib/format';
import { LegalCaseStage } from './LegalCaseStage';
import type {
  EnforcementMethod,
  HearingOutcome,
  LegalCase,
  LegalCaseOutcome,
} from '@/types/legal-case';

/**
 * One case: where it is, what happened, and the single next thing to do.
 *
 * Reworked from a scrolling stack of five forms (file, schedule, record,
 * decide, enforce) which showed every moment of a case's life at once — so most
 * of it was always irrelevant, and the one action that mattered was buried among
 * four that did not apply.
 *
 * Now: the stage, a timeline of what has actually happened, and exactly one
 * primary action — the next thing. Secondary actions live in a menu. Explanatory
 * prose is kept in the one place it earns its space: when an action is about to
 * be *refused* because the notice ladder has not run out, because that refusal is
 * the whole point of the feature and a person needs to know why.
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
  { value: 'NOT_REACHED', label: 'Not reached' },
  { value: 'DECIDED', label: 'Decided' },
];

const OUTCOME_LABEL: Record<string, string> = {
  WON: 'Won',
  LOST: 'Lost',
  SETTLED: 'Settled',
  DISCONTINUED: 'Discontinued',
};

type TimelineEntry = {
  at: string;
  title: string;
  detail?: string;
  tone: 'neutral' | 'good' | 'warn';
};

/** What has actually happened, in order. Derived from the case, not stored twice. */
function timelineFor(legalCase: LegalCase): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      at: legalCase.createdAt,
      title: 'Case opened',
      detail: legalCase.description,
      tone: 'neutral',
    },
  ];

  if (legalCase.filedAt) {
    entries.push({
      at: legalCase.filedAt,
      title: 'Filed in court',
      detail: [legalCase.court, legalCase.suitNumber].filter(Boolean).join(' · '),
      tone: 'neutral',
    });
  }

  for (const hearing of legalCase.hearings) {
    if (hearing.heldAt) {
      entries.push({
        at: hearing.heldAt,
        title: `Sitting ${hearing.outcome?.replace(/_/g, ' ').toLowerCase() ?? 'held'}`,
        detail: hearing.notes ?? hearing.purpose ?? undefined,
        tone: hearing.outcome === 'ADJOURNED' ? 'warn' : 'good',
      });
    } else {
      entries.push({
        at: hearing.scheduledFor,
        title: 'Hearing scheduled',
        detail: hearing.purpose ?? undefined,
        tone: 'neutral',
      });
    }
  }

  if (legalCase.outcomeAt) {
    entries.push({
      at: legalCase.outcomeAt,
      title: `Decided — ${OUTCOME_LABEL[legalCase.outcome ?? ''] ?? legalCase.outcome}`,
      detail: legalCase.outcomeNotes ?? undefined,
      tone: legalCase.outcome === 'WON' ? 'good' : 'warn',
    });
  }

  if (legalCase.advocateInstructedAt) {
    entries.push({
      at: legalCase.advocateInstructedAt,
      title: `Counsel instructed — ${legalCase.advocateName ?? ''}`.trim(),
      detail:
        [legalCase.advocateFirm, legalCase.advocateFeeAgreement].filter(Boolean).join(' · ') ||
        undefined,
      tone: 'neutral',
    });
  }

  if (legalCase.enforcementAt) {
    entries.push({
      at: legalCase.enforcementAt,
      title: `Enforcement — ${legalCase.enforcementMethod?.replace(/_/g, ' ').toLowerCase() ?? 'recorded'}`,
      detail: legalCase.enforcementNotes ?? undefined,
      tone: 'neutral',
    });
  }

  if (legalCase.closedAt) {
    entries.push({
      at: legalCase.closedAt,
      title: legalCase.status === 'WITHDRAWN' ? 'Withdrawn' : 'Case closed',
      tone: 'neutral',
    });
  }

  // Newest last reads as a story; the scheduled hearing has a future date so it
  // lands at the end, which is where "what is next" belongs.
  return entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function LegalCaseDetail({
  legalCase,
  onOpenChange,
  isSubmitting,
  onFile,
  onScheduleHearing,
  onRecordHearing,
  onEnforce,
  onRecordAdvocate,
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
    /** Present when the sitting decided the matter. */
    decision?: { outcome: LegalCaseOutcome; notes?: string };
  }) => void;
  onEnforce: (input: { method: EnforcementMethod; notes?: string; enforcedAt?: string }) => void;
  onRecordAdvocate: (input: {
    name: string;
    firm?: string;
    contact?: string;
    feeAgreement?: string;
  }) => void;
  onClose: (notes?: string) => void;
  onWithdraw: () => void;
}) {
  const [court, setCourt] = useState('');
  const [suitNumber, setSuitNumber] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [heldAt, setHeldAt] = useState('');
  const [hearingOutcome, setHearingOutcome] = useState<HearingOutcome>('HEARD');
  const [hearingNotes, setHearingNotes] = useState('');
  const [adjournNextFor, setAdjournNextFor] = useState('');
  const [decisionOutcome, setDecisionOutcome] = useState<LegalCaseOutcome | ''>('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [enforcementMethod, setEnforcementMethod] = useState<EnforcementMethod>('BAILIFF');
  const [enforcementNotes, setEnforcementNotes] = useState('');
  const [advocateOpen, setAdvocateOpen] = useState(false);
  const [advName, setAdvName] = useState('');
  const [advFirm, setAdvFirm] = useState('');
  const [advContact, setAdvContact] = useState('');
  const [advFee, setAdvFee] = useState('');

  if (!legalCase) return null;

  const isDone = legalCase.status === 'CLOSED' || legalCase.status === 'WITHDRAWN';
  const needsLease = legalCase.kind === 'EVICTION' && legalCase.leaseId === null;
  const fileBlocked = legalCase.ladderReadyToFile === false;

  const hasAdvocate = Boolean(legalCase.advocateName);
  const openAdvocate = () => {
    setAdvName(legalCase.advocateName ?? '');
    setAdvFirm(legalCase.advocateFirm ?? '');
    setAdvContact(legalCase.advocateContact ?? '');
    setAdvFee(legalCase.advocateFeeAgreement ?? '');
    setAdvocateOpen(true);
  };

  const nextHearing = legalCase.hearings
    .filter((hearing) => hearing.heldAt === null)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0];

  /**
   * The one thing to do next.
   *
   * A single primary action, chosen by state, rather than five forms competing
   * for attention. The `blocked` case is the important one: it is the refusal the
   * whole notice ladder exists to produce, and it gets the words.
   */
  const primary = (() => {
    if (isDone) return { kind: 'none' as const };

    if (legalCase.status === 'OPEN') {
      if (needsLease) {
        return {
          kind: 'blocked' as const,
          title: 'Cannot be filed',
          why: 'This case names no tenancy, so there is no notice record to check — and the notices are what a possession claim is built on.',
        };
      }
      if (fileBlocked) {
        return {
          kind: 'blocked' as const,
          title: 'Not ready to file',
          why: 'The notice ladder is not finished. The notice to quit and the notice of the owner’s intention to recover must both be served and run out first. Filing early is a common way to lose the case outright.',
        };
      }
      return { kind: 'file' as const };
    }

    if (legalCase.status === 'FILED') {
      if (nextHearing) {
        return { kind: 'record' as const, hearing: nextHearing };
      }
      return { kind: 'schedule' as const };
    }

    if (legalCase.status === 'DECIDED') return { kind: 'enforce' as const };

    return { kind: 'none' as const };
  })();

  const timeline = timelineFor(legalCase);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4 pr-8">
          <div className="min-w-0">
            <DialogTitle className="truncate text-xl font-semibold tracking-[-0.02em] text-foreground">
              {legalCase.kindLabel}
            </DialogTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {legalCase.property.address}, {legalCase.property.city}
              {legalCase.unitName && ` · ${legalCase.unitName}`}
              {legalCase.tenantName && ` · ${legalCase.tenantName}`}
            </p>
          </div>

          {!isDone && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Case actions"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={openAdvocate}>
                  {hasAdvocate ? 'Update advocate' : 'Record advocate'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onClose(undefined)}>Close case</DropdownMenuItem>
                <DropdownMenuItem onSelect={onWithdraw} className="text-destructive">
                  Withdraw case
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <LegalCaseStage status={legalCase.status} variant="full" />
        </div>

        {legalCase.court && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Landmark className="h-3.5 w-3.5" aria-hidden />
            {legalCase.court}
            {legalCase.suitNumber && (
              <span className="text-foreground">· {legalCase.suitNumber}</span>
            )}
          </p>
        )}

        {hasAdvocate && !advocateOpen && (
          <div className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              <span className="text-foreground">{legalCase.advocateName}</span>
              {legalCase.advocateFirm && ` · ${legalCase.advocateFirm}`}
              {legalCase.advocateContact && ` · ${legalCase.advocateContact}`}
              {legalCase.advocateFeeAgreement && (
                <span className="mt-0.5 block text-xs">{legalCase.advocateFeeAgreement}</span>
              )}
            </span>
          </div>
        )}

        {/* --- The one next action ------------------------------------------- */}
        {primary.kind === 'blocked' && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-warning/30 bg-warning-subtle p-4 text-sm text-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-medium">{primary.title}</p>
              <p className="mt-0.5 text-muted-foreground">{primary.why}</p>
              {legalCase.leaseId && (
                <Button
                  variant="ghost"
                  className="mt-2"
                  href={`/landlord/notices?leaseId=${legalCase.leaseId}`}
                >
                  Open the tenancy&rsquo;s notices
                </Button>
              )}
            </div>
          </div>
        )}

        {primary.kind === 'file' && (
          <section className="mt-4 rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Gavel className="h-4 w-4 text-muted-foreground" aria-hidden />
              File in court
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Court" required>
                <input
                  value={court}
                  onChange={(event) => setCourt(event.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  placeholder="Lagos High Court"
                />
              </Field>
              <Field label="Suit number" required>
                <input
                  value={suitNumber}
                  onChange={(event) => setSuitNumber(event.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  placeholder="LD/1234/2026"
                />
              </Field>
            </div>
            <Button
              className="mt-3"
              isLoading={isSubmitting}
              disabled={!court.trim() || !suitNumber.trim()}
              onClick={() => onFile({ court: court.trim(), suitNumber: suitNumber.trim() })}
            >
              Record as filed
            </Button>
          </section>
        )}

        {primary.kind === 'schedule' && (
          <section className="mt-4 rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
              Nothing is on the calendar
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This case is filed and has no next date. Schedule it, or it is the one that gets
              forgotten.
            </p>
            <div className="mt-3 max-w-xs">
              <Field label="Next hearing" required>
                <DatePicker value={hearingDate} onChange={setHearingDate} />
              </Field>
            </div>
            <Button
              className="mt-3"
              isLoading={isSubmitting}
              disabled={!hearingDate}
              onClick={() => onScheduleHearing({ scheduledFor: hearingDate })}
            >
              Add to calendar
            </Button>
          </section>
        )}

        {primary.kind === 'record' && (
          <section className="mt-4 rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
              Sitting on {formatDate(primary.hearing.scheduledFor)}
            </h3>
            {primary.hearing.purpose && (
              <p className="mt-0.5 text-sm text-muted-foreground">{primary.hearing.purpose}</p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="What happened" required>
                <Select
                  ariaLabel="What happened"
                  value={hearingOutcome}
                  onValueChange={(value) => setHearingOutcome(value as HearingOutcome)}
                  options={HEARING_RESULTS}
                />
              </Field>
              <Field label="Date held" required>
                <DatePicker
                  value={heldAt}
                  onChange={setHeldAt}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </Field>
            </div>

            {hearingOutcome === 'ADJOURNED' && (
              <>
                <div className="mt-3 max-w-xs">
                  <Field label="Adjourned to" required>
                    <DatePicker value={adjournNextFor} onChange={setAdjournNextFor} />
                  </Field>
                </div>
                <p className="mt-1.5 text-xs text-warning">
                  Required. An adjournment with no next date is how a case goes quiet.
                </p>
              </>
            )}

            {/*
              A decision happens at a sitting, so it is captured here rather than
              as its own step. Splitting them would mean recording the same event
              twice and leaving a case sitting in FILED with a decision nobody
              entered.
            */}
            {hearingOutcome === 'DECIDED' && (
              <div className="mt-3">
                <Field label="What the court decided" required>
                  <Select
                    ariaLabel="What the court decided"
                    value={decisionOutcome}
                    onValueChange={(value) => setDecisionOutcome(value as LegalCaseOutcome)}
                    options={OUTCOMES}
                    placeholder="Choose the outcome"
                  />
                </Field>
                <Field label="Decision notes">
                  <Textarea
                    value={decisionNotes}
                    onChange={(event) => setDecisionNotes(event.target.value)}
                    rows={2}
                    placeholder="Judgment entered for the full amount plus costs."
                  />
                </Field>
              </div>
            )}

            <Field label="Notes">
              <Textarea
                value={hearingNotes}
                onChange={(event) => setHearingNotes(event.target.value)}
                rows={2}
              />
            </Field>

            <Button
              className="mt-3"
              isLoading={isSubmitting}
              disabled={
                !heldAt ||
                (hearingOutcome === 'ADJOURNED' && !adjournNextFor) ||
                (hearingOutcome === 'DECIDED' && !decisionOutcome)
              }
              onClick={() =>
                onRecordHearing({
                  hearingId: primary.hearing.id,
                  heldAt,
                  outcome: hearingOutcome,
                  ...(hearingNotes.trim() ? { notes: hearingNotes.trim() } : {}),
                  ...(hearingOutcome === 'ADJOURNED' ? { adjournNextFor } : {}),
                  ...(hearingOutcome === 'DECIDED' && decisionOutcome
                    ? {
                        decision: {
                          outcome: decisionOutcome,
                          ...(decisionNotes.trim() ? { notes: decisionNotes.trim() } : {}),
                        },
                      }
                    : {}),
                })
              }
            >
              Record sitting
            </Button>
          </section>
        )}

        {primary.kind === 'enforce' && (
          <section className="mt-4 rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              Decide how it is enforced
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {legalCase.outcome ? OUTCOME_LABEL[legalCase.outcome] : 'Decided'}
              {legalCase.outcomeAt && ` on ${formatDate(legalCase.outcomeAt)}`}. Nothing is done
              until enforcement is recorded.
            </p>
            <div className="mt-3 max-w-sm">
              <Field label="Method" required>
                <Select
                  ariaLabel="Method"
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
            <Button
              className="mt-3"
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
          </section>
        )}

        {advocateOpen && (
          <section className="mt-4 rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden />
              {hasAdvocate ? 'Update the advocate' : 'Record the advocate'}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Advocate" required>
                <input
                  value={advName}
                  onChange={(event) => setAdvName(event.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  placeholder="Adaeze Okafor"
                />
              </Field>
              <Field label="Firm">
                <input
                  value={advFirm}
                  onChange={(event) => setAdvFirm(event.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  placeholder="Okafor & Co."
                />
              </Field>
            </div>
            <Field label="Contact">
              <input
                value={advContact}
                onChange={(event) => setAdvContact(event.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                placeholder="Phone or email, as on the brief"
              />
            </Field>
            <Field label="Fee agreement">
              <Textarea
                value={advFee}
                onChange={(event) => setAdvFee(event.target.value)}
                rows={2}
                placeholder="10% of the sum recovered, ₦250,000 on brief"
              />
            </Field>
            <div className="mt-3 flex gap-2">
              <Button
                isLoading={isSubmitting}
                disabled={!advName.trim()}
                onClick={() => {
                  onRecordAdvocate({
                    name: advName.trim(),
                    ...(advFirm.trim() ? { firm: advFirm.trim() } : {}),
                    ...(advContact.trim() ? { contact: advContact.trim() } : {}),
                    ...(advFee.trim() ? { feeAgreement: advFee.trim() } : {}),
                  });
                  setAdvocateOpen(false);
                }}
              >
                {hasAdvocate ? 'Update' : 'Record'} advocate
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAdvocateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </section>
        )}

        {/* --- Timeline ------------------------------------------------------- */}
        <section className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">What has happened</h3>
          <ol className="mt-3 space-y-0">
            {timeline.map((entry, index) => (
              <li
                key={`${entry.at}-${entry.title}`}
                className="relative border-l border-border pb-4 pl-5 last:pb-0"
              >
                <span
                  aria-hidden
                  className={`absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full ${
                    entry.tone === 'good'
                      ? 'bg-success'
                      : entry.tone === 'warn'
                        ? 'bg-warning'
                        : 'bg-muted-foreground/40'
                  }`}
                />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-foreground">{entry.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {index === timeline.length - 1 && new Date(entry.at) > new Date()
                      ? `due ${formatDate(entry.at)}`
                      : formatDate(entry.at)}
                  </span>
                </div>
                {entry.detail && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{entry.detail}</p>
                )}
              </li>
            ))}
          </ol>
        </section>

        {isDone && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {legalCase.status === 'WITHDRAWN'
              ? 'Withdrawn. It stops being evidence of anything, and it does not unblock anything the way a closed case does.'
              : 'Closed. Nothing further is expected.'}
          </p>
        )}

        {!isDone && primary.kind === 'none' && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Nothing to do right now.
          </p>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          Opened by {legalCase.openedByName ?? 'unknown'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
