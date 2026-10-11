import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, MapPin, Repeat, Siren } from 'lucide-react-native';
import {
  Card,
  Chip,
  EmptyState,
  ErrorState,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { EnterpriseUpsell, StatTile } from '@/components/estate/gate/GateUI';
import { StatusPill } from '@/components/host/HostUI';
import { useEstate } from '@/hooks/useEstate';
import {
  CONTRACTOR_STATUS_TONE,
  estateGateApi,
  formatMinutes,
  gateKeys,
  lacksTier,
  onSiteOrder,
  planRefusal,
  retryUnlessPlanGate,
  windowStart,
  type AuthorisationDwell,
  type DwellSort,
  type OnSiteEntry,
} from '@/lib/api/estateGate';
import { formatDate, formatTime } from '@/lib/format';

/** Re-read while somebody is inside: elapsed times move by the minute, not the second. */
const BOARD_POLL_MS = 30_000;

const RANGES = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '12 months' },
];

const UPSELL_POINTS = [
  'See who is still inside, and for how long',
  'Spot a visit that ran past the hours the estate set',
  'How long each regular visitor actually stays',
];

/**
 * Dwell analytics (Enterprise): who is still inside right now, and how long
 * regular visitors' visits actually run. Every sentence is worded by the
 * server and shown as-is, so this screen and the office's overstay alert
 * describe the same visit the same way.
 */
export default function EstateDwell() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { estate, estateId } = useEstate();
  const [rangeDays, setRangeDays] = useState(30);
  // Held in state, never derived in render: it is in the query key.
  const [from, setFrom] = useState(() => windowStart(30));
  const [sort, setSort] = useState<DwellSort>('dwell');
  const [onlyUsed, setOnlyUsed] = useState(false);
  // A known shortfall isn't worth two certain 403s; an unknown plan still asks.
  const locked = lacksTier(estate?.planTier);

  const board = useQuery({
    queryKey: gateKeys.onSite(estateId),
    queryFn: () => estateGateApi.onSiteBoard(estateId),
    enabled: !!estateId && !locked,
    retry: retryUnlessPlanGate,
    refetchInterval: (q) => (q.state.data?.entries.length ? BOARD_POLL_MS : false),
  });
  const report = useQuery({
    queryKey: gateKeys.dwellReport(estateId, from, sort),
    queryFn: () => estateGateApi.authorisationDwell(estateId, { from, sort }),
    enabled: !!estateId && !locked,
    retry: retryUnlessPlanGate,
  });
  const refusal = planRefusal(board.error) ?? planRefusal(report.error);

  const rows = (report.data?.authorisations ?? []).filter((r) => !onlyUsed || r.visits > 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={board.isRefetching || report.isRefetching}
          onRefresh={() => {
            if (locked) return;
            void board.refetch();
            void report.refetch();
          }}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow={estate?.name ?? 'Gate'}
        title="Dwell analytics"
        subtitle="Who is still inside, and how long visits run"
        onBack={() => router.back()}
      />

      {locked || refusal ? (
        <EnterpriseUpsell
          feature="Dwell analytics"
          points={UPSELL_POINTS}
          current={refusal?.current ?? estate?.planTier}
          estateName={estate?.name}
        />
      ) : (
        <>
          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Still inside" />
            {board.isError && !board.data ? (
              <ErrorState onRetry={() => board.refetch()} />
            ) : !board.data ? (
              <Skeleton height={180} radius={radius.lg} />
            ) : !board.data.entries.length ? (
              <EmptyState
                icon={<Clock size={34} color={colors.mutedForeground} />}
                title="Nobody is recorded as inside"
                description="Every visitor the gate let in has been logged out."
              />
            ) : (
              <>
                <Card elevated style={{ gap: spacing.md }}>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <StatTile value={board.data.tally.open} label="Inside" />
                    <StatTile
                      value={board.data.tally.overstaying}
                      label="Past the hours set"
                      tone={board.data.tally.overstaying ? 'danger' : 'muted'}
                    />
                  </View>
                  <Text variant="callout">{board.data.tally.label}</Text>
                  <Text variant="caption" color="mutedForeground">
                    The office is told once when a visit runs more than {board.data.graceMinutes}{' '}
                    minutes past the hours the estate set for a regular visitor. Visits with no end
                    time are listed but nobody is notified.
                  </Text>
                </Card>
                {onSiteOrder(board.data.entries).map((e) => (
                  <OnSiteCard key={e.passId} entry={e} />
                ))}
                <Text variant="caption" color="mutedForeground">
                  Counted at {formatTime(board.data.asOf)}. If somebody left but is still listed,
                  it’s their exit that wasn’t logged at the gate.
                </Text>
              </>
            )}
          </View>

          <View style={{ gap: spacing.md }}>
            <SectionHeader title="How long visits run" />
            <Text variant="caption" color="mutedForeground">
              For each regular visitor: how often they came and how long they stayed, against the
              hours the estate set.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {RANGES.map((r) => (
                <Chip
                  key={r.days}
                  label={r.label}
                  selected={rangeDays === r.days}
                  onPress={() => {
                    setRangeDays(r.days);
                    setFrom(windowStart(r.days));
                  }}
                />
              ))}
            </View>
            <SegmentedControl
              accessibilityLabel="Sort by"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'dwell', label: 'Longest stays' },
                { value: 'visits', label: 'Most visits' },
              ]}
            />
            {report.isError && !report.data ? (
              <ErrorState onRetry={() => report.refetch()} />
            ) : !report.data ? (
              <Skeleton height={160} radius={radius.lg} />
            ) : !report.data.authorisations.length ? (
              <EmptyState
                icon={<Repeat size={34} color={colors.mutedForeground} />}
                title="No regular visitors yet"
                description="Authorise a cleaner, driver or contractor under Regular visitors and their visits are measured here."
              />
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                    {formatDate(report.data.from, 'short')} to {formatDate(report.data.to, 'short')}
                  </Text>
                  <Chip
                    size="sm"
                    label="Only ones used"
                    selected={onlyUsed}
                    onPress={() => setOnlyUsed((v) => !v)}
                  />
                </View>
                {rows.length ? (
                  rows.map((r) => <DwellCard key={r.contractorPassId} row={r} />)
                ) : (
                  <Text variant="callout" color="mutedForeground">
                    Nobody was let in on a regular-visitor code in this period.
                  </Text>
                )}
                <Text variant="caption" color="mutedForeground">
                  Averages cover finished visits only. A visit still open has no length yet.
                </Text>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function OnSiteCard({ entry: e }: { entry: OnSiteEntry }) {
  const { colors, spacing } = useTheme();
  return (
    <Card
      elevated
      accessible
      accessibilityLabel={`${e.overstaying ? 'Overstaying. ' : ''}${e.visitorName}, ${e.sourceLabel}, at ${e.unitLabel}. ${e.insideLabel}. ${e.expectationLabel}.${e.reportedAt ? ' The office has been told.' : ''}`}
      style={{
        gap: spacing.xs,
        borderWidth: e.overstaying ? 1 : 0,
        borderColor: colors.destructive,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {e.overstaying ? <Siren size={16} color={colors.destructive} /> : null}
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {e.visitorName}
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
        {e.sourceLabel}
        {e.authorisationName ? ` · ${e.authorisationName}` : ''}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <MapPin size={12} color={colors.mutedForeground} />
        <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
          {e.unitLabel}
          {e.gateName ? ` · in through ${e.gateName}` : ''}
        </Text>
      </View>
      <Text
        variant="callout"
        style={{
          color: e.overstaying ? colors.destructive : colors.foreground,
          fontWeight: '600',
        }}
      >
        {e.insideLabel}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {e.expectationLabel}
        {e.reportedAt ? ` · office told at ${formatTime(e.reportedAt)}` : ''}
      </Text>
    </Card>
  );
}

function DwellCard({ row: r }: { row: AuthorisationDwell }) {
  const { colors, spacing } = useTheme();
  const firm = [r.company, r.trade].filter(Boolean).join(' · ') || 'No firm recorded';
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View
        accessible
        accessibilityLabel={`${r.name}, ${r.statusLabel}. ${firm}. ${r.scheduleLabel}`}
        style={{ gap: 2 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {r.name}
          </Text>
          <StatusPill label={r.statusLabel} tone={CONTRACTOR_STATUS_TONE[r.status] ?? 'neutral'} />
        </View>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {firm}
          {r.householdLabel ? ` · ${r.householdLabel}` : ''}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {r.scheduleLabel}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatTile value={r.visits} label={r.visits === 1 ? 'visit' : 'visits'} />
        <StatTile value={formatMinutes(r.averageMinutes)} label="average" />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatTile value={formatMinutes(r.longestMinutes)} label="longest" />
        <StatTile
          value={r.overstays}
          label="past the hours"
          tone={r.overstays ? 'danger' : 'muted'}
        />
      </View>
      <Text variant="callout" color="mutedForeground">
        {r.summaryLabel}
      </Text>
      {r.openVisits > 0 ? (
        <Text variant="caption" style={{ color: colors.warning }}>
          {r.openVisits === 1
            ? 'One visit was never logged out, so it isn’t in the average.'
            : `${r.openVisits} visits were never logged out, so they aren’t in the average.`}
        </Text>
      ) : null}
    </Card>
  );
}
