'use client';

import { CalendarClock, Gavel, Scale } from 'lucide-react';
import { Badge, Card, type BadgeVariant } from '@getrentos/ui';

import { formatDate } from '@/lib/format';
import { legalCaseStatusBadges } from '@/lib/statusBadge';
import type { LegalCase, LegalCaseStatus } from '@/types/legal-case';

/**
 * Where a case stands, and what is outstanding on it.
 *
 * The same discipline the notices surface follows: the status is a value the
 * server holds and a person set, the next hearing is derived from the hearings,
 * and anything blocking progress is stated in words with its reason. A disabled
 * button teaches nobody anything.
 */

const OUTCOME_LABEL: Record<string, string> = {
  WON: 'Won',
  LOST: 'Lost',
  SETTLED: 'Settled',
  DISCONTINUED: 'Discontinued',
};

export function LegalCaseStatusBadge({ status }: { status: LegalCaseStatus }) {
  const presentation = legalCaseStatusBadges[status];
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}

export function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return null;
  const variant: BadgeVariant =
    outcome === 'WON' ? 'success' : outcome === 'LOST' ? 'danger' : 'neutral';
  return <Badge variant={variant}>{OUTCOME_LABEL[outcome] ?? outcome}</Badge>;
}

export function LegalCaseCard({ legalCase, onOpen }: { legalCase: LegalCase; onOpen: () => void }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
              <Scale className="h-4 w-4 text-gray-400" aria-hidden />
              {legalCase.kindLabel}
            </span>
            <LegalCaseStatusBadge status={legalCase.status} />
            <OutcomeBadge outcome={legalCase.outcome} />
          </div>

          <p className="mt-1 text-sm text-gray-600">{legalCase.description}</p>

          <p className="mt-1.5 text-xs text-gray-500">
            {legalCase.property.address}, {legalCase.property.city}
            {legalCase.unitName && ` · ${legalCase.unitName}`}
            {legalCase.tenantName && ` · ${legalCase.tenantName}`}
          </p>

          <dl className="mt-2 space-y-1 text-xs text-gray-500">
            {legalCase.court && (
              <div className="flex gap-1.5">
                <dt>Suit</dt>
                <dd className="text-gray-700">
                  {legalCase.court}
                  {legalCase.suitNumber && ` · ${legalCase.suitNumber}`}
                </dd>
              </div>
            )}
            {/*
              A filed case with nothing on the calendar is the one that gets
              forgotten, so the date is the most useful thing on the card.
            */}
            {legalCase.nextHearingAt ? (
              <div className="flex items-center gap-1.5">
                <dt className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  Next hearing
                </dt>
                <dd className="text-gray-700">{formatDate(legalCase.nextHearingAt)}</dd>
              </div>
            ) : legalCase.status === 'FILED' ? (
              <div className="flex gap-1.5">
                <dt>Next hearing</dt>
                <dd className="text-amber-700">Nothing on the calendar</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-full px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          Open case
        </button>
      </div>

      {legalCase.outstanding.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
          {legalCase.outstanding.map((item) => (
            <li key={item.action} className="text-xs">
              <span className="flex items-center gap-1.5 font-medium text-gray-800">
                <Gavel className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                {item.action}
              </span>
              <span className="mt-0.5 block text-gray-600">{item.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
