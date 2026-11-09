'use client';

import { CheckCircle2, Circle, ClipboardList, Clock, ShieldAlert } from '@sureground/icons';
import { Alert, Badge, EmptyState, type BadgeVariant } from '@sureground/ui';

import { formatDate } from '@/lib/format';
import type { LeaseLadder, NoticeKind, NoticeState, TenancyNotice } from '@/types/tenancy-notice';

// State comes from the server (EXPIRED is clock-derived there); a block is stated with its date, since serving the next step early is fatal.

const STATE: Record<NoticeState, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  SERVED: { label: 'Running', variant: 'info' },
  EXPIRED: { label: 'Run out', variant: 'success' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
  SUPERSEDED: { label: 'Replaced', variant: 'neutral' },
};

const KIND_LABEL: Record<NoticeKind, string> = {
  ARREARS_REMINDER: 'Reminder',
  DEMAND_LETTER: 'Demand letter',
  NOTICE_TO_QUIT: 'Notice to quit',
  NOTICE_OF_INTENTION_TO_RECOVER: 'Intention to recover',
  COURT_SUMMONS: 'Court summons',
};

const SOURCE_LABEL: Record<string, string> = {
  FIRM_OVERRIDE: 'your own recorded period',
  MANUAL: 'typed for this notice',
};

export const noticeKindLabel = (kind: NoticeKind) => KIND_LABEL[kind];

const isSpent = (state: NoticeState) => state === 'WITHDRAWN' || state === 'SUPERSEDED';

const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

export function NoticeStateBadge({ state }: { state: NoticeState }) {
  const presentation = STATE[state];
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}

function StepMark({ state }: { state: NoticeState }) {
  if (state === 'EXPIRED') return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />;
  if (state === 'SERVED') return <Clock className="h-4 w-4 text-info" aria-hidden />;
  return <Circle className="h-4 w-4 text-muted-foreground/50" aria-hidden />;
}

function NoticeStep({
  notice,
  actions,
}: {
  notice: TenancyNotice;
  actions?: (notice: TenancyNotice) => React.ReactNode;
}) {
  const facts: string[] = [];
  if (notice.serviceDate) facts.push(`Served ${formatDate(notice.serviceDate)}`);
  else if (notice.state === 'DRAFT') facts.push('Not served');

  if (notice.expiresAt) {
    const left =
      notice.state === 'SERVED' && notice.daysRemaining !== null
        ? ` · ${notice.daysRemaining} ${notice.daysRemaining === 1 ? 'day' : 'days'} left`
        : '';
    const over = notice.state === 'EXPIRED' || isSpent(notice.state);
    facts.push(`${over ? 'Ran to' : 'Runs to'} ${formatDate(notice.expiresAt)}${left}`);
  } else if (notice.periodDays !== null) {
    facts.push(`Runs ${notice.periodDays} days from service`);
  } else {
    facts.push('No set period. This step does not count down');
  }

  const source = SOURCE_LABEL[notice.periodSource];
  if (source) facts.push(`Period is ${source}`);

  const basis = notice.periodDays !== null && source ? notice.periodBasis : null;

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          <StepMark state={notice.state} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span
              className={`text-sm font-medium ${
                isSpent(notice.state) ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              {notice.kindLabel}
            </span>
            <NoticeStateBadge state={notice.state} />
          </div>

          {notice.reason && (
            <p className="mt-1 text-sm text-muted-foreground">
              {notice.reason}
              {notice.arrearsAmount !== null && <> · arrears {naira(notice.arrearsAmount)}</>}
            </p>
          )}

          <p className="mt-1 text-xs text-muted-foreground/90">{facts.join(' · ')}</p>
          {notice.evidenceNote && !isSpent(notice.state) && (
            <p className="mt-1 text-xs text-muted-foreground/90">
              Proof of service: {notice.evidenceNote}
            </p>
          )}

          {basis && <p className="mt-1 text-xs text-muted-foreground/90">Recorded on: {basis}</p>}

          {actions && <div className="mt-2.5">{actions(notice)}</div>}
        </div>
      </div>
    </li>
  );
}

export function NoticeLadderTimeline({
  ladder,
  actions,
}: {
  ladder: LeaseLadder;
  actions?: (notice: TenancyNotice) => React.ReactNode;
}) {
  const { notices, next, nextBlockedReason } = ladder;

  return (
    <div className="space-y-3">
      {next && nextBlockedReason && (
        <Alert
          variant="warning"
          icon={ShieldAlert}
          title={`${KIND_LABEL[next.kind]} is not available yet`}
        >
          <p>{nextBlockedReason}</p>
          {next.blockedUntil && (
            <p className="mt-1.5 text-xs font-medium text-warning">
              Available from {formatDate(next.blockedUntil)}
            </p>
          )}
        </Alert>
      )}

      {ladder.jurisdictionFellBack && (
        <Alert variant="warning">
          <p>
            The property&rsquo;s state is recorded as &ldquo;{ladder.jurisdictionDerivedFrom}
            &rdquo;, which does not match a jurisdiction, so this tenancy is being read against{' '}
            <span className="font-medium text-foreground">{ladder.jurisdiction}</span>. Check the
            property before relying on any period here.
          </p>
        </Alert>
      )}

      {notices.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing has been served yet"
          description={
            next
              ? `The first step is the ${KIND_LABEL[next.kind].toLowerCase()}.`
              : 'This tenancy is at the top of the ladder.'
          }
          size="compact"
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {notices.map((notice) => (
            <NoticeStep key={notice.id} notice={notice} actions={actions} />
          ))}
        </ul>
      )}

      {next && !nextBlockedReason && (
        <p className="px-1 text-xs text-muted-foreground">
          Next step: <span className="font-medium text-foreground">{KIND_LABEL[next.kind]}</span>.
          Its period comes from the register for {ladder.jurisdiction}, so it will be refused until
          that has been recorded.
        </p>
      )}
    </div>
  );
}
