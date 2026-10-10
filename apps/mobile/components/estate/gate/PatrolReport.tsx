import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Route as RouteIcon } from 'lucide-react-native';
import { Card, Chip, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { StatTile } from '@/components/estate/gate/GateUI';
import { StatusPill } from '@/components/host/HostUI';
import {
  ROUND_STATUS_TONE,
  estateGateApi,
  gateKeys,
  retryUnlessPlanGate,
  roundOrder,
  windowStart,
  type PatrolReport as Report,
  type PatrolRound,
} from '@/lib/api/estateGate';
import { formatDate, formatTime } from '@/lib/format';

const RANGES = [7, 14, 30];

const when = (iso: string) => `${formatDate(iso, 'short')}, ${formatTime(iso)}`;

/**
 * "Did the patrol go out?" Every round that was due, and the night nobody
 * walked shown first. Labels are worded by the server so this agrees with the
 * notice the office was already sent.
 */
export function PatrolReport({ estateId }: { estateId: string }) {
  const { spacing, radius } = useTheme();
  const [days, setDays] = useState(14);
  // Held in state, never derived in render: it is in the query key.
  const [from, setFrom] = useState(() => windowStart(14));

  const query = useQuery({
    queryKey: gateKeys.patrolReport(estateId, from),
    queryFn: () => estateGateApi.patrolReport(estateId, { from }),
    enabled: !!estateId,
    retry: retryUnlessPlanGate,
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="caption" color="mutedForeground">
        Every time a round was due, whether it was walked, and where it wasn’t.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {RANGES.map((d) => (
          <Chip
            key={d}
            label={`Last ${d} nights`}
            selected={days === d}
            onPress={() => {
              setDays(d);
              setFrom(windowStart(d));
            }}
          />
        ))}
      </View>
      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data ? (
        <Skeleton height={200} radius={radius.lg} />
      ) : (
        <ReportBody report={query.data} />
      )}
    </View>
  );
}

function ReportBody({ report }: { report: Report }) {
  const { colors, spacing } = useTheme();
  const rounds = roundOrder(report.rounds);
  return (
    <>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {/* Every round in the period, open ones included, so the count matches the list. */}
        <StatTile value={rounds.length} label="Rounds due" />
        <StatTile value={report.tally.walked} label="Walked" tone="success" />
        <StatTile
          value={report.tally.missed}
          label="Not walked"
          tone={report.tally.missed ? 'danger' : 'muted'}
        />
      </View>
      <Text variant="callout" color="mutedForeground">
        {report.tally.label}
      </Text>
      {!rounds.length ? (
        <EmptyState
          icon={<RouteIcon size={34} color={colors.mutedForeground} />}
          title="No rounds in this period"
          description="A round shows here once it’s due. If nothing is listed, check that a round is set up and not paused."
        />
      ) : (
        rounds.map((r) => <RoundCard key={r.id} round={r} />)
      )}
      {report.tally.missed > 0 ? (
        <Text variant="caption" color="mutedForeground">
          A missed round is reported to the office when its window closes. A scan proves someone
          holding the code reached the checkpoint, so give a checkpoint a new code if its label goes
          missing.
        </Text>
      ) : null}
    </>
  );
}

function RoundCard({ round: r }: { round: PatrolRound }) {
  const { colors, spacing } = useTheme();
  const missed = r.status === 'MISSED';
  const outOfOrder = r.status !== 'OPEN' && r.scanned > 0 && !r.inOrder;
  return (
    <Card
      elevated
      style={{ gap: spacing.sm, borderWidth: missed ? 1 : 0, borderColor: colors.destructive }}
    >
      <View
        accessible
        accessibilityLabel={`${r.routeName}, ${r.statusLabel}. Due ${when(r.scheduledFor)}.${outOfOrder ? ' Walked out of order.' : ''}${r.late ? ` ${r.late} late.` : ''}`}
        style={{ gap: spacing.xs }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {r.routeName}
          </Text>
          <StatusPill label={r.statusLabel} tone={ROUND_STATUS_TONE[r.status] ?? 'neutral'} />
        </View>
        <Text variant="caption" color="mutedForeground">
          Due {when(r.scheduledFor)} · window closed {formatTime(r.windowEndsAt)}
        </Text>
        {outOfOrder || r.late || r.reportedAt ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {outOfOrder ? <StatusPill label="Out of order" tone="warning" /> : null}
            {r.late ? <StatusPill label={`${r.late} late`} tone="warning" /> : null}
            {r.reportedAt ? <StatusPill label="Office told" tone="neutral" /> : null}
          </View>
        ) : null}
      </View>
      {missed && r.missing.length ? (
        <View
          style={{
            padding: spacing.sm,
            borderRadius: 10,
            backgroundColor: colors.destructiveSubtle,
            gap: 2,
          }}
        >
          <Text variant="callout">Nobody reached {r.missing.map((m) => m.name).join(', ')}</Text>
          <Text variant="caption" color="mutedForeground">
            {r.scanned} of {r.expected} checkpoints scanned.
          </Text>
        </View>
      ) : null}
      {r.scans.map((s) => (
        <View key={s.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ width: 56 }}>
            {formatTime(s.scannedAt)}
          </Text>
          <Text variant="caption" style={{ flex: 1 }}>
            {s.checkpointName}
            {s.expectedPosition !== null ? ` (step ${s.expectedPosition})` : ''}
            {s.late ? ' · after the window' : ''}
          </Text>
        </View>
      ))}
      {r.status === 'OPEN' && !r.scans.length ? (
        <Text variant="caption" color="mutedForeground">
          Still inside its window. Nothing to report yet.
        </Text>
      ) : null}
    </Card>
  );
}
