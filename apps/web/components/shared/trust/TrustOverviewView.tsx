'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageErrorState,
  PageLoadingState,
  type BadgeVariant,
} from '@sureground/ui';
import { trustService } from '@/services/trustService';
import { unwrap } from '@/lib/apiHelpers';
import { trustKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import { TrustScoreBreakdownCard } from '@/components/shared/trust/TrustScoreBreakdownCard';
import { TrustExplanationCard } from '@/components/shared/trust/TrustExplanationCard';
import type { TrustPortal, TrustRequirementKey, TrustStatus } from '@/types/trust-score';

const STATUS: Record<TrustStatus, { label: string; variant: BadgeVariant }> = {
  VERIFIED: { label: 'Verified', variant: 'success' },
  IN_PROGRESS: { label: 'In progress', variant: 'info' },
  PENDING_PROVIDER: { label: 'Checking', variant: 'info' },
  PENDING_REVIEW: { label: 'In review', variant: 'info' },
  ACTION_REQUIRED: { label: 'Action needed', variant: 'warning' },
  REVERIFICATION_REQUIRED: { label: 'Action needed', variant: 'warning' },
  NOT_STARTED: { label: 'Not started', variant: 'neutral' },
  FAILED: { label: 'Did not pass', variant: 'danger' },
  REJECTED: { label: 'Not approved', variant: 'danger' },
  EXPIRED: { label: 'Expired', variant: 'warning' },
  UNAVAILABLE: { label: 'Unavailable', variant: 'neutral' },
};

const StatusBadge = ({ status }: { status: TrustStatus }) => (
  <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>
);

const PORTAL_NOUN: Record<TrustPortal, string> = {
  renter: 'renting',
  buyer: 'buying',
  landlord: 'letting your properties',
  owner: 'selling and letting your properties',
  agent: 'working as an agent',
  realtor: 'working as a realtor',
  manager: 'managing properties',
};

interface TrustOverviewViewProps {
  portal: TrustPortal;
  /** Where each requirement is done in this portal (or a handler for an in-page tab). */
  onAction: (key: TrustRequirementKey) => void;
  /** Extra detail for the disclosure, e.g. the renter's score history. */
  moreDetails?: ReactNode;
}

/**
 * The Trust & Verification page for every portal (trust redesign). It answers,
 * in order: am I verified, what is my score, what is still needed here, and
 * what do I do next. Identity is shown apart from the score, because they
 * measure different things: who you are, and how much history backs you.
 * Only the requirements of this portal are listed, so a renter is never asked
 * for a landlord's checks. Every value comes from GET /trust/overview.
 */
export function TrustOverviewView({ portal, onAction, moreDetails }: TrustOverviewViewProps) {
  const query = useQuery({
    queryKey: trustKeys.overview(portal),
    queryFn: () => unwrap(trustService.getOverview(portal)),
    // While a provider or reviewer is deciding, check back without a reload.
    refetchInterval: (q) =>
      q.state.data?.requirements.some((r) => r.status === 'PENDING_PROVIDER') ? 5000 : false,
  });

  if (query.isLoading) return <PageLoadingState />;
  if (query.isError || !query.data) {
    return (
      <PageErrorState
        title="Trust and verification is unavailable"
        description="We could not load your verification status. Nothing has changed on your account."
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  const { identity, requirements, score, nextAction } = query.data;
  const done = requirements.filter((r) => r.status === 'VERIFIED').length;

  return (
    <div className="space-y-6">
      {/* A. Overview: identity and score side by side, never merged. */}
      <Card>
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="space-y-2 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Identity</p>
              <StatusBadge status={identity.status} />
            </div>
            <p className="text-sm text-foreground">{identity.detail}</p>
            {identity.dueBy && (
              <p className="text-xs text-muted-foreground">
                Take it by {formatDate(identity.dueBy, 'long')}.
              </p>
            )}
          </div>
          <div className="space-y-2 p-5">
            <p className="text-sm font-medium text-muted-foreground">Trust score</p>
            {score ? (
              <>
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {score.total}
                  <span className="text-base font-normal text-muted-foreground"> / 100</span>
                </p>
                {score.stage && (
                  <p className="text-sm text-muted-foreground">{score.stage.label}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Scores are not switched on yet. Your verification still counts in full.
              </p>
            )}
          </div>
        </div>

        {/* D. One primary action. */}
        {nextAction && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              Next: <span className="font-medium">{nextAction.label}</span>
            </p>
            <Button
              onClick={() => onAction(nextAction.key)}
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="right"
            >
              Continue
            </Button>
          </div>
        )}
      </Card>

      {/* B. What this portal needs. */}
      <Card>
        <CardHeader
          action={
            <span className="text-sm tabular-nums text-muted-foreground">
              {done} of {requirements.length}
            </span>
          }
        >
          <CardTitle as="h2">Needed for {PORTAL_NOUN[portal]}</CardTitle>
          <CardDescription>Only the checks this part of Sureground needs.</CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="divide-y divide-border">
            {requirements.map((r) => {
              const actionable = ![
                'VERIFIED',
                'PENDING_PROVIDER',
                'PENDING_REVIEW',
                'UNAVAILABLE',
              ].includes(r.status);
              return (
                <li key={r.key} className="flex items-start justify-between gap-4 py-3.5">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{r.label}</p>
                    <p className="text-sm text-muted-foreground">{r.detail}</p>
                    {r.dueBy && (
                      <p className="text-xs text-warning">By {formatDate(r.dueBy, 'long')}</p>
                    )}
                    {r.updatedAt && r.status === 'VERIFIED' && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.updatedAt, 'long')}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={r.status} />
                    {actionable && r.key !== nextAction?.key && (
                      <Button
                        variant="link"
                        onClick={() => onAction(r.key)}
                        aria-label={`${r.label}: start`}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* C. Details, only when asked for. */}
      <details className="group rounded-xl border border-border bg-card">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 rounded-xl">
          How this works
          <span className="ml-1 text-muted-foreground group-open:hidden">(show)</span>
          <span className="ml-1 hidden text-muted-foreground group-open:inline">(hide)</span>
        </summary>
        <div className="space-y-4 border-t border-border px-5 py-5 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Identity</span> says who you are: your NIN
            checked against official records and a live selfie, checked by Smile ID. It is the same
            in every part of Sureground.
          </p>
          <p>
            <span className="font-medium text-foreground">Your trust score</span> says how much
            history backs you: verification, payments and how you have used Sureground. Checks that
            do not apply to you, such as a landlord&apos;s ownership documents for a renter, never
            count against it.
          </p>
          {requirements.map((r) => (
            <p key={r.key}>
              <span className="font-medium text-foreground">{r.label}:</span> {r.why}
            </p>
          ))}
          {score && <TrustScoreBreakdownCard breakdown={score} />}
          {score && <TrustExplanationCard />}
          {moreDetails}
        </div>
      </details>
    </div>
  );
}
