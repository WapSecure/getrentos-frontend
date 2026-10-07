'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Badge, Button, Card, Field, Select, Textarea } from '@getrentos/ui';

import { formatDate } from '@/lib/format';
import type { NoticeKind, NoticePeriodSettings, UnconfiguredPeriod } from '@/types/tenancy-notice';

/**
 * The period register, and the worklist of what is still missing.
 *
 * This is one screen for two reasons. A firm that has recorded nothing cannot
 * serve anything that runs for a period, so the missing entries are not
 * housekeeping — they are the thing blocking the ladder. And the number a firm
 * enters is *theirs*: this platform ships no day counts of its own, so the entry
 * carries a basis and is recorded as the firm's, not as an authority.
 */

const JURISDICTIONS: { value: string; label: string }[] = [
  { value: 'NG-LA', label: 'Lagos' },
  { value: 'NG-FC', label: 'Federal Capital Territory' },
  { value: 'NG', label: 'Nigeria (federal fallback)' },
];

const PERIOD_KINDS: { value: NoticeKind; label: string }[] = [
  { value: 'NOTICE_TO_QUIT', label: 'Notice to quit' },
  { value: 'NOTICE_OF_INTENTION_TO_RECOVER', label: "Notice of the owner's intention to recover" },
];

export function NoticePeriodRegister({
  settings,
  isSubmitting,
  onSubmit,
  onClear,
}: {
  settings: NoticePeriodSettings;
  isSubmitting: boolean;
  onSubmit: (input: {
    jurisdiction: string;
    kind: NoticeKind;
    days: number;
    basis: string;
  }) => void;
  onClear: (input: { jurisdiction: string; kind: NoticeKind }) => void;
}) {
  const [jurisdiction, setJurisdiction] = useState('NG-LA');
  const [kind, setKind] = useState<NoticeKind>('NOTICE_TO_QUIT');
  const [days, setDays] = useState('');
  const [basis, setBasis] = useState('');

  const missing = settings.unconfigured;
  const daysNumber = Number(days);
  const canSubmit = Number.isInteger(daysNumber) && daysNumber > 0 && basis.trim().length >= 10;

  return (
    <div className="space-y-5">
      {missing.length > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">
              {missing.length} {missing.length === 1 ? 'period is' : 'periods are'} still unrecorded
            </p>
            <p className="mt-0.5 text-xs">
              Any notice that runs for a statutory period will be refused in these jurisdictions
              until a number is recorded. That is deliberate: this platform does not hold a day
              count of its own, so it cannot supply one and will not guess.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Every statutory period this property base needs has a number recorded against it.
            Notices that run for a period can be served.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900">Record a period</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            The number and its basis are stored as yours. Both are shown beside every notice served
            under them, because &ldquo;we used 90 days&rdquo; is unanswerable six months later
            without them.
          </p>

          <div className="mt-4 space-y-4">
            <Field label="Jurisdiction" required>
              <Select
                ariaLabel="Jurisdiction"
                value={jurisdiction}
                onValueChange={setJurisdiction}
                options={JURISDICTIONS}
              />
            </Field>

            <Field label="Step" required>
              <Select
                ariaLabel="Step"
                value={kind}
                onValueChange={(value) => setKind(value as NoticeKind)}
                options={PERIOD_KINDS}
              />
            </Field>

            <Field
              label="Days"
              required
              hint="Whole days. Lagos ties the notice to the period of the tenancy rather than to one number, so check the length for this tenancy before entering it."
            >
              <input
                type="number"
                min={1}
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="90"
              />
            </Field>

            <Field
              label="Basis"
              required
              hint="Where this number comes from — the provision, the advice, the date. This is what makes a mis-service diagnosable rather than mysterious."
            >
              <Textarea
                value={basis}
                onChange={(event) => setBasis(event.target.value)}
                rows={3}
                placeholder="Confirmed with counsel against the Lagos State Tenancy Law, 12 Oct."
              />
            </Field>

            <Button
              isLoading={isSubmitting}
              disabled={!canSubmit}
              onClick={() =>
                onSubmit({ jurisdiction, kind, days: daysNumber, basis: basis.trim() })
              }
            >
              Record period
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-900">Recorded periods</h3>
              <span className="text-xs text-gray-500">table {settings.tableVersion}</span>
            </div>

            {settings.entries.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Nothing recorded yet. Every statutory notice will be refused until something is.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {settings.entries.map((entry) => (
                  <li key={entry.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.kindLabel} — {entry.jurisdiction}
                      </span>
                      <Badge variant={entry.scope === 'FIRM' ? 'success' : 'neutral'}>
                        {entry.scope === 'FIRM' ? 'yours' : 'shipped'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{entry.days} days</p>
                    <p className="mt-0.5 text-xs text-gray-500">{entry.basis}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        updated {formatDate(entry.updatedAt)}
                      </span>
                      {entry.editable && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            onClear({ jurisdiction: entry.jurisdiction, kind: entry.kind })
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {missing.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-900">Still to confirm</h3>
              <ul className="mt-3 space-y-3">
                {missing.map((entry) => (
                  <MissingPeriod
                    key={`${entry.jurisdiction}|${entry.kind}`}
                    entry={entry}
                    onPick={() => {
                      setJurisdiction(entry.jurisdiction);
                      setKind(entry.kind);
                    }}
                  />
                ))}
              </ul>
            </Card>
          )}

          <div className="flex items-start gap-2 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              This register is a tracking record, not legal advice. Nothing here is asserted by this
              platform — the entries are yours, and the basis is recorded so the reasoning survives
              the person who made the entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissingPeriod({ entry, onPick }: { entry: UnconfiguredPeriod; onPick: () => void }) {
  return (
    <li className="rounded-md border border-gray-200 p-3">
      <p className="text-sm font-medium text-gray-900">
        {entry.kind.replace(/_/g, ' ').toLowerCase()} — {entry.jurisdiction}
      </p>
      <p className="mt-1 text-xs text-gray-600">{entry.basis}</p>
      <Button variant="ghost" className="mt-2" onClick={onPick}>
        Record this one
      </Button>
    </li>
  );
}
