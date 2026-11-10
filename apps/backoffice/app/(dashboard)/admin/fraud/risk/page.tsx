'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Pagination,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminRiskService, type RiskDecision, type RiskEvent } from '@/services/adminRiskService';
import { useAdminUser } from '../../layout';

const PAGE_SIZE = 20;

const RULE: Record<string, string> = {
  NEW_DEVICE: 'Sign-in from a new device',
  PAYOUT_SOON_AFTER_BANK_CHANGE: 'Payout soon after a bank change',
  PAYOUT_FROM_NEW_DEVICE: 'Payout from a new device',
  PAYOUT_VELOCITY: 'Many payout requests in a day',
  REPEATED_STEP_UP_FAILURE: 'Repeated failed confirmations',
};

const OUTCOME: Record<string, string> = {
  ALLOW: 'Allow and tell the user',
  REQUIRE_STEP_UP: 'Ask them to confirm it’s them',
  REQUIRE_REVERIFICATION: 'Ask them to verify again',
  HOLD_FOR_REVIEW: 'Hold for review',
  DENY: 'Refuse',
};

const EVENT: Record<RiskEvent, string> = {
  SIGN_IN: 'Sign-in',
  PAYOUT_REQUEST: 'Payout request',
  STEP_UP_FAILURES: 'Confirming it’s them',
};

const REVIEW: Record<string, string> = {
  OPEN: 'Waiting for review',
  RELEASED: 'Released',
  CONFIRMED: 'Confirmed: fraud alert opened',
};

const ReviewPanel = ({ decision, canAct }: { decision: RiskDecision; canAct: boolean }) => {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const review = useMutation({
    mutationFn: (action: 'release' | 'confirm') =>
      unwrap(adminRiskService.review(decision.id, action, note.trim())),
    onSuccess: () => {
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'riskDecisions'] });
    },
  });
  const r = decision.review!;
  return (
    <div className="space-y-2 border-t border-border pt-3">
      {r.appealNote && (
        <p className="text-sm text-muted-foreground">
          The user says: <span className="text-foreground">{r.appealNote}</span>
        </p>
      )}
      {r.status !== 'OPEN' ? (
        <p className="text-sm text-muted-foreground">
          {REVIEW[r.status]}
          {r.reviewedAt && <> · {lagos(r.reviewedAt)}</>}
          {r.note && (
            <>
              {' '}
              · <span className="text-foreground">{r.note}</span>
            </>
          )}
        </p>
      ) : canAct ? (
        <>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you checked: called the user, matched the bank name, …"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              isLoading={review.isPending && review.variables === 'release'}
              disabled={note.trim().length < 10}
              onClick={() => review.mutate('release')}
            >
              Release payout
            </Button>
            <Button
              variant="outline"
              isLoading={review.isPending && review.variables === 'confirm'}
              disabled={note.trim().length < 10}
              onClick={() => review.mutate('confirm')}
            >
              Confirm and open a fraud alert
            </Button>
          </div>
          <p className="text-2xs text-muted-foreground">
            Releasing lets this user’s payouts through for 72 hours. You’ll be asked to confirm it’s
            you.
          </p>
          {review.error && <Alert variant="danger">{(review.error as Error).message}</Alert>}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {REVIEW.OPEN}. Releasing needs fraud.freeze.
        </p>
      )}
    </div>
  );
};

const lagos = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const DecisionRow = ({ decision, canAct }: { decision: RiskDecision; canAct: boolean }) => (
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
        {decision.review && (
          <Badge variant={decision.review.status === 'OPEN' ? 'danger' : 'neutral'}>
            {REVIEW[decision.review.status]}
          </Badge>
        )}
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
    {decision.review && <ReviewPanel decision={decision} canAct={canAct} />}
  </Card>
);

type EventFilter = RiskEvent | 'all';

export default function RiskDecisionsPage() {
  const [event, setEvent] = useState<EventFilter>('all');
  const [view, setView] = useState<'flagged' | 'review' | 'every'>('flagged');
  const adminUser = useAdminUser();
  const canAct = hasAdminPermission(adminUser?.roles, 'fraud.freeze');
  const [page, setPage] = useState(1);

  const summary = useQuery({
    queryKey: adminKeys.riskSummary,
    queryFn: () => unwrap(adminRiskService.summary()),
  });
  const list = useQuery({
    queryKey: adminKeys.riskDecisions({ event, view, page }),
    queryFn: () =>
      unwrap(
        adminRiskService.list({
          event: event === 'all' ? undefined : event,
          flaggedOnly: view !== 'every',
          reviewStatus: view === 'review' ? 'OPEN' : undefined,
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
            <TabsTrigger value="STEP_UP_FAILURES">Confirmations</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs
          value={view}
          onValueChange={(v) => {
            setView(v as typeof view);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
            <TabsTrigger value="review">Needs review</TabsTrigger>
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
          title={
            view === 'review'
              ? 'Nothing waiting for review'
              : view === 'flagged'
                ? 'Nothing flagged'
                : 'No decisions yet'
          }
          description={
            view === 'review'
              ? 'Payouts held by an enforced rule appear here for release or confirmation.'
              : view === 'flagged'
                ? 'When a rule fires on a sign-in or payout request, it shows up here with the reason.'
                : 'Decisions appear as people sign in and request payouts.'
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {list.data?.items.map((decision) => (
              <DecisionRow key={decision.id} decision={decision} canAct={canAct} />
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
