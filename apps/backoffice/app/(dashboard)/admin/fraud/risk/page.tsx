'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Activity } from '@sureground/icons';
import {
  Badge,
  Card,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Pagination,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminRiskService, type RiskDecision, type RiskEvent } from '@/services/adminRiskService';

const PAGE_SIZE = 20;

const RULE: Record<string, string> = {
  NEW_DEVICE: 'Sign-in from a new device',
  PAYOUT_SOON_AFTER_BANK_CHANGE: 'Payout soon after a bank change',
  PAYOUT_FROM_NEW_DEVICE: 'Payout from a new device',
  PAYOUT_VELOCITY: 'Many payout requests in a day',
};

const OUTCOME: Record<string, string> = {
  ALLOW: 'Allow and tell the user',
  REQUIRE_STEP_UP: 'Ask them to confirm it’s them',
  REQUIRE_REVERIFICATION: 'Ask them to verify again',
  HOLD_FOR_REVIEW: 'Hold for review',
  DENY: 'Refuse',
};

const EVENT: Record<RiskEvent, string> = { SIGN_IN: 'Sign-in', PAYOUT_REQUEST: 'Payout request' };

const lagos = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const DecisionRow = ({ decision }: { decision: RiskDecision }) => (
  <Card className="space-y-2 p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">{decision.user.name}</h3>
        <p className="text-sm text-muted-foreground">
          {EVENT[decision.event] ?? decision.event}
          {decision.deviceLabel && <> · {decision.deviceLabel}</>} · {lagos(decision.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={decision.outcome === 'ALLOW' ? 'neutral' : 'warning'}>
          {OUTCOME[decision.outcome] ?? decision.outcome}
        </Badge>
        {!decision.enforced && <Badge variant="neutral">Shadow: not acted on</Badge>}
      </div>
    </div>
    {decision.signals.length > 0 ? (
      <ul className="space-y-1 text-sm text-foreground">
        {decision.signals.map((signal) => (
          <li key={signal.rule}>
            <span className="font-medium">{RULE[signal.rule] ?? signal.rule}:</span> {signal.reason}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">No rule fired.</p>
    )}
  </Card>
);

type EventFilter = RiskEvent | 'all';

export default function RiskDecisionsPage() {
  const [event, setEvent] = useState<EventFilter>('all');
  const [flaggedOnly, setFlaggedOnly] = useState(true);
  const [page, setPage] = useState(1);

  const summary = useQuery({
    queryKey: adminKeys.riskSummary,
    queryFn: () => unwrap(adminRiskService.summary()),
  });
  const list = useQuery({
    queryKey: adminKeys.riskDecisions({ event, flaggedOnly, page }),
    queryFn: () =>
      unwrap(
        adminRiskService.list({
          event: event === 'all' ? undefined : event,
          flaggedOnly,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk decisions"
        description="What the risk rules flagged and why. Payout rules run in shadow mode: they are recorded here and never hold money until their thresholds are approved."
      />

      <Card className="p-5">
        <h2 className="font-semibold text-foreground">Last {summary.data?.days ?? 30} days</h2>
        {summary.isError ? (
          <p className="mt-2 text-sm text-muted-foreground">This summary could not load.</p>
        ) : summary.data && summary.data.rules.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No rule has fired.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {summary.data?.rules.map((rule) => (
              <li
                key={`${rule.event}:${rule.rule}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="text-foreground">
                  {RULE[rule.rule] ?? rule.rule}
                  <span className="text-muted-foreground">
                    {' '}
                    · {OUTCOME[rule.wouldBe] ?? rule.wouldBe}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {!rule.enforced && <Badge variant="neutral">Shadow</Badge>}
                  <span className="font-medium tabular-nums text-foreground">{rule.count}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {summary.data && (
          <p className="mt-3 text-2xs text-muted-foreground">Policy {summary.data.policyVersion}</p>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={event}
          onValueChange={(v) => {
            setEvent(v as EventFilter);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="SIGN_IN">Sign-ins</TabsTrigger>
            <TabsTrigger value="PAYOUT_REQUEST">Payout requests</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs
          value={flaggedOnly ? 'flagged' : 'every'}
          onValueChange={(v) => {
            setFlaggedOnly(v === 'flagged');
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
            <TabsTrigger value="every">Every decision</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {list.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : list.isError && !list.data ? (
        <PageErrorState title="Could not load risk decisions" onRetry={() => void list.refetch()} />
      ) : list.data && list.data.items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={flaggedOnly ? 'Nothing flagged' : 'No decisions yet'}
          description={
            flaggedOnly
              ? 'When a rule fires on a sign-in or payout request, it shows up here with the reason.'
              : 'Decisions appear as people sign in and request payouts.'
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {list.data?.items.map((decision) => (
              <DecisionRow key={decision.id} decision={decision} />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={list.data?.total ?? 0}
            onPageChange={setPage}
            className="mt-6"
          />
        </>
      )}
    </div>
  );
}
