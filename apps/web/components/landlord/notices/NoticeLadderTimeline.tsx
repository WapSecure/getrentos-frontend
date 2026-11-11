'use client';

import { ClipboardList, ShieldAlert } from '@sureground/icons';
import {
  Alert,
  Badge,
  EmptyState,
  Timeline,
  type BadgeVariant,
  type TimelineState,
} from '@sureground/ui';

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

const STEP_STATE: Record<NoticeState, TimelineState> = {
  DRAFT: 'pending',
  SERVED: 'current',
  EXPIRED: 'done',
  WITHDRAWN: 'skipped',
  SUPERSEDED: 'skipped',
};

function noticeDetails(notice: TenancyNotice) {
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
    <>
      {notice.reason && (
        <p className="text-sm">
          {notice.reason}
          {notice.arrearsAmount !== null && <> · arrears {naira(notice.arrearsAmount)}</>}
        </p>
      )}

      <p className={notice.reason ? 'mt-1 text-muted-foreground/90' : 'text-muted-foreground/90'}>
        {facts.join(' · ')}
      </p>
      {notice.evidenceNote && !isSpent(notice.state) && (
        <p className="mt-1 text-muted-foreground/90">Proof of service: {notice.evidenceNote}</p>
      )}

      {basis && <p className="mt-1 text-muted-foreground/90">Recorded on: {basis}</p>}
    </>
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
        <div className="rounded-2xl border border-border bg-card p-4">
          <Timeline
            aria-label="Notices served"
            items={notices.map((notice) => ({
              id: notice.id,
              title: notice.kindLabel,
              state: STEP_STATE[notice.state],
              badge: <NoticeStateBadge state={notice.state} />,
              description: noticeDetails(notice),
              actions: actions?.(notice),
            }))}
          />
        </div>
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
