'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, Route as RouteIcon } from 'lucide-react';
import { Badge, Card, EmptyState, Skeleton } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { PatrolRound } from '@/types/estate';

const DAY_MS = 24 * 60 * 60_000;

const RANGES = [
  { value: '7', label: 'Last 7 nights' },
  { value: '14', label: 'Last 14 nights' },
  { value: '30', label: 'Last 30 nights' },
];

/**
 * Which rounds were due, and which of them nobody walked.
 *
 * This is the screen the feature is bought for, so it is ordered by what
 * happened rather than by when: a round nobody walked is the loudest thing on
 * the page. Every label is written server-side and rendered verbatim, because
 * the office's screen and the notice the office was already sent have to agree
 * about the same night.
 *
 * The honest limit is stated on the page rather than left to be discovered: a
 * scan proves somebody holding the code was at the checkpoint, and a code
 * photographed off the wall would defeat that. Which is why the register next
 * door treats a new code as a one-click action.
 */
export const RoundReport = ({ estateId }: { estateId: string }) => {
  const [rangeDays, setRangeDays] = useState('14');
  /**
   * Held in state rather than computed during render: an instant computed in the
   * render body is a different instant every time, and it is in the query key,
   * so react-query would see a new window on every render and fetch forever.
   */
  const [from, setFrom] = useState(() => new Date(Date.now() - 14 * DAY_MS).toISOString());

  const selectRange = (days: string) => {
    setRangeDays(days);
    setFrom(new Date(Date.now() - Number(days) * DAY_MS).toISOString());
  };

  const reportQuery = useQuery({
    queryKey: estateKeys.patrolReport(estateId, from),
    queryFn: () => unwrap(estateService.getPatrolReport(estateId, { from })),
  });

  if (reportQuery.isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const report = reportQuery.data;
  const rounds = report?.rounds ?? [];
  const missed = rounds.filter((round) => round.status === 'MISSED');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Did the patrol go out?</h2>
          <p className="text-sm text-muted-foreground">
            Every night a round was due, whether it was walked, and where it was not.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              aria-pressed={rangeDays === range.value}
              onClick={() => selectRange(range.value)}
              className={`min-h-9 rounded-xl border px-3 text-sm transition-colors ${
                rangeDays === range.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-foreground/20'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {report && (
        <div className="grid gap-3 sm:grid-cols-3">
          {/*
           * Every round in the period, open ones included. `tally.closed` is the
           * DECIDED count, so using it here said "0 rounds due" directly above a
           * round listed underneath it.
           */}
          <Stat label="Rounds due" value={rounds.length} hint={report.tally.label} />
          <Stat label="Walked" value={report.tally.walked} tone="success" />
          <Stat
            label="Not walked"
            value={report.tally.missed}
            tone={report.tally.missed > 0 ? 'danger' : 'neutral'}
          />
        </div>
      )}

      {rounds.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title="No rounds in this period"
          description="A round appears here once it is due. If nothing is listed, check that a round is set up and not paused."
        />
      ) : (
        <div className="space-y-3">
          {[...rounds]
            // Missed first: the page exists to make the night nobody walked the
            // loudest thing on it, not the most recent thing.
            .sort((a, b) => {
              const rank = (round: PatrolRound) =>
                round.status === 'MISSED' ? 0 : round.status === 'OPEN' ? 1 : 2;
              return rank(a) - rank(b) || b.scheduledFor.localeCompare(a.scheduledFor);
            })
            .map((round) => (
              <RoundCard key={round.id} round={round} />
            ))}
        </div>
      )}

      {missed.length > 0 && (
        <p className="text-xs text-muted-foreground">
          A missed round was reported to the office when its window closed. A scan proves that
          somebody holding the code reached the checkpoint — the code is what makes that true, so
          give a checkpoint a new one whenever a label goes missing.
        </p>
      )}
    </div>
  );
};

const Stat = ({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: 'neutral' | 'success' | 'danger';
}) => (
  <Card className="p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p
      className={`mt-1 text-2xl font-semibold ${
        tone === 'danger'
          ? 'text-destructive'
          : tone === 'success'
            ? 'text-green-600 dark:text-green-400'
            : 'text-foreground'
      }`}
    >
      {value}
    </p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </Card>
);

const formatInstant = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const RoundCard = ({ round }: { round: PatrolRound }) => {
  const icon =
    round.status === 'COMPLETE' ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : round.status === 'MISSED' ? (
      <AlertTriangle className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    );
  const variant = round.status === 'COMPLETE' ? 'success' : round.status === 'MISSED' ? 'danger' : 'info';

  return (
    <Card
      className={`p-4 ${round.status === 'MISSED' ? 'border-destructive/40' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{round.routeName}</p>
          <p className="text-sm text-muted-foreground">
            Due {formatInstant(round.scheduledFor)} · window shut {formatInstant(round.windowEndsAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={variant} icon={icon}>
            {round.statusLabel}
          </Badge>
          {round.expected > 0 && round.status !== 'OPEN' && !round.inOrder && round.scanned > 0 && (
            <Badge variant="warning">Out of order</Badge>
          )}
          {round.late > 0 && <Badge variant="warning">{round.late} late</Badge>}
          {round.reportedAt && <Badge variant="neutral">Office told</Badge>}
        </div>
      </div>

      {round.status === 'MISSED' && round.missing.length > 0 && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-sm text-foreground">
            Nobody reached{' '}
            <span className="font-medium">{round.missing.map((row) => row.name).join(', ')}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {round.scanned} of {round.expected} checkpoints were scanned.
          </p>
        </div>
      )}

      {round.scans.length > 0 && (
        <ol className="mt-3 space-y-1">
          {round.scans.map((scan) => (
            <li key={scan.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">{formatInstant(scan.scannedAt)}</span>
              <span className="text-foreground">{scan.checkpointName}</span>
              {scan.expectedPosition !== null && (
                <span className="text-xs text-muted-foreground">
                  (step {scan.expectedPosition})
                </span>
              )}
              {scan.late && <Badge variant="warning">After the window</Badge>}
            </li>
          ))}
        </ol>
      )}

      {round.status === 'OPEN' && round.scans.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Still inside its window. Nothing to report yet.
        </p>
      )}
    </Card>
  );
};
