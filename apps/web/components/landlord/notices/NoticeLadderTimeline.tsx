'use client';

import { AlertTriangle, CheckCircle2, Circle, Clock, FileText, ShieldAlert } from 'lucide-react';
import { Badge, Card, type BadgeVariant } from '@getrentos/ui';

import { formatDate } from '@/lib/format';
import type { LeaseLadder, NoticeState, TenancyNotice } from '@/types/tenancy-notice';

/**
 * Where a tenancy stands on the escalation ladder.
 *
 * Three deliberate choices, all about not letting this view imply more than it
 * knows:
 *
 * 1. **The state comes from the server.** `EXPIRED` is derived from the clock
 *    there, so it cannot disagree with the expiry date shown beside it. Nothing
 *    here recomputes a state from a date.
 * 2. **The block is stated in words, with its date.** A disabled button teaches
 *    nobody anything; the sentence and the date are what a firm needs in order
 *    to plan, and what stops the next step being served early.
 * 3. **A period's provenance is shown next to the number.** "90 days" is
 *    unanswerable six months later without knowing whether a person typed it or
 *    a register supplied it.
 */

const STATE_PRESENTATION: Record<
  NoticeState,
  { label: string; variant: BadgeVariant; hint: string }
> = {
  DRAFT: {
    label: 'Draft',
    variant: 'neutral',
    hint: 'Not served yet, so nothing is running and nothing can be relied on.',
  },
  SERVED: {
    label: 'Running',
    variant: 'info',
    hint: 'Served and counting down. The next step cannot be served until it runs out.',
  },
  EXPIRED: {
    label: 'Run out',
    variant: 'success',
    hint: 'The period has run its course, which is what makes the next step available.',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    variant: 'neutral',
    hint: 'Taken back, so it is not evidence of anything. Distinct from one that ran out.',
  },
  SUPERSEDED: {
    label: 'Replaced',
    variant: 'neutral',
    hint: 'Replaced by a later notice of the same kind. Not evidence of anything either.',
  },
};

const SOURCE_LABEL: Record<string, string> = {
  TABLE: 'from the reference table',
  FIRM_OVERRIDE: 'from your own recorded period',
  MANUAL: 'typed for this notice',
  NOT_APPLICABLE: 'no period applies',
};

function Naira({ amount }: { amount: number }) {
  return <span className="tabular-nums">₦{amount.toLocaleString('en-NG')}</span>;
}

export function NoticeStateBadge({ state }: { state: NoticeState }) {
  const presentation = STATE_PRESENTATION[state];
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}

function NoticeRow({ notice }: { notice: TenancyNotice }) {
  const presentation = STATE_PRESENTATION[notice.state];

  return (
    <li className="relative border-l border-dashed border-gray-200 pl-6 pb-6 last:pb-0">
      <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
        {notice.state === 'EXPIRED' ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
        ) : notice.state === 'SERVED' ? (
          <Clock className="h-4 w-4 text-blue-600" aria-hidden />
        ) : (
          <Circle className="h-4 w-4 text-gray-300" aria-hidden />
        )}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{notice.kindLabel}</span>
        <NoticeStateBadge state={notice.state} />
        {notice.arrearsAmount !== null && (
          <span className="text-xs text-gray-600">
            arrears <Naira amount={notice.arrearsAmount} />
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-gray-600">{notice.reason}</p>

      <dl className="mt-2 space-y-1 text-xs text-gray-500">
        {notice.servedAt && (
          <div className="flex gap-1.5">
            <dt>Recorded as served</dt>
            <dd className="text-gray-700">
              {formatDate(notice.servedAt)}
              {notice.serviceDate && `, from ${formatDate(notice.serviceDate)}`}
            </dd>
          </div>
        )}

        {notice.expiresAt ? (
          <div className="flex gap-1.5">
            <dt>Runs to</dt>
            <dd className="text-gray-700">
              {formatDate(notice.expiresAt)}
              {notice.state === 'SERVED' && notice.daysRemaining !== null && (
                <span className="ml-1 text-gray-500">
                  ({notice.daysRemaining} {notice.daysRemaining === 1 ? 'day' : 'days'} left)
                </span>
              )}
            </dd>
          </div>
        ) : notice.periodDays !== null ? (
          /*
            A draft with a resolved period is a third case, and saying "no set
            period" here would contradict the period shown a line below: the
            number is known, the clock simply has not started. Nothing runs until
            service is recorded, and the wording has to say that rather than
            implying the step has no duration.
          */
          <div className="flex gap-1.5">
            <dt>Runs to</dt>
            <dd className="text-gray-700">
              Not yet served — nothing is counting down. It will run {notice.periodDays} days from
              the service date.
            </dd>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <dt>Runs to</dt>
            <dd className="text-gray-700">No set period — this step does not count down</dd>
          </div>
        )}

        {notice.periodDays !== null && (
          <div className="flex gap-1.5">
            <dt>Period</dt>
            <dd className="text-gray-700">
              {notice.periodDays} days, {SOURCE_LABEL[notice.periodSource] ?? notice.periodSource}
            </dd>
          </div>
        )}

        {notice.periodBasis && (
          <div className="flex gap-1.5">
            <dt>Basis</dt>
            <dd className="text-gray-700">{notice.periodBasis}</dd>
          </div>
        )}

        {notice.evidenceNote && (
          <div className="flex gap-1.5">
            <dt>Proof of service</dt>
            <dd className="text-gray-700">{notice.evidenceNote}</dd>
          </div>
        )}
      </dl>

      {notice.state === 'DRAFT' && (
        <p className="mt-1.5 text-xs text-gray-500">{presentation.hint}</p>
      )}
      {(notice.state === 'WITHDRAWN' || notice.state === 'SUPERSEDED') && (
        <p className="mt-1.5 text-xs text-gray-500">{presentation.hint}</p>
      )}
    </li>
  );
}

export function NoticeLadderTimeline({
  ladder,
  actions,
}: {
  ladder: LeaseLadder;
  /** Rendered per notice: the serve / withdraw controls a caller supplies. */
  actions?: (notice: TenancyNotice) => React.ReactNode;
}) {
  const { lease, notices, next, nextBlockedReason } = ladder;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {lease.property.address}, {lease.property.city}
            </p>
            <p className="text-xs text-gray-500">
              {lease.tenantName ?? 'Tenant not named'} · {ladder.jurisdiction}
            </p>
          </div>
          <Badge variant="neutral">{notices.length} on the ladder</Badge>
        </div>

        {ladder.jurisdictionFellBack && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              The property&rsquo;s state was recorded as &ldquo;{ladder.jurisdictionDerivedFrom}
              &rdquo;, which could not be matched to a jurisdiction, so this tenancy is being read
              against <strong>{ladder.jurisdiction}</strong> instead. Check the property&rsquo;s
              state before relying on any period here.
            </p>
          </div>
        )}
      </Card>

      {/*
        The block, stated before the notices rather than after, because it is the
        thing that decides what the firm can do next.
      */}
      {next && nextBlockedReason && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">The next step is not available yet</p>
            <p className="mt-0.5">{nextBlockedReason}</p>
            {next.blockedUntil && (
              <p className="mt-1 text-xs">
                Available from {formatDate(next.blockedUntil)}. Serving it before then is a common
                way to invalidate the whole claim, so this is refused rather than warned about.
              </p>
            )}
          </div>
        </div>
      )}

      {notices.length === 0 ? (
        <Card className="flex items-start gap-3 p-4" static>
          <FileText className="mt-0.5 h-5 w-5 text-gray-400" aria-hidden />
          <div>
            <p className="text-sm font-medium text-gray-900">Nothing has been served yet</p>
            <p className="mt-0.5 text-sm text-gray-600">
              {next
                ? `The first step available is the ${next.kind.replace(/_/g, ' ').toLowerCase()}.`
                : 'This tenancy is at the top of the ladder.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <ol className="mt-1">
            {notices.map((notice) => (
              <div key={notice.id}>
                <NoticeRow notice={notice} />
                {actions && <div className="mb-4 -mt-3 pl-6">{actions(notice)}</div>}
              </div>
            ))}
          </ol>
        </Card>
      )}

      {next && !nextBlockedReason && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-medium text-gray-900">
            Next step: {next.kind.replace(/_/g, ' ').toLowerCase()}
          </p>
          <p className="mt-0.5 text-xs">
            Nothing is blocking it. Its period is decided by the register for {ladder.jurisdiction},
            so it will be refused if that has not been recorded.
          </p>
        </div>
      )}
    </div>
  );
}
