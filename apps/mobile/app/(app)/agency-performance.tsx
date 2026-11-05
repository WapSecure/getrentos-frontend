import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, FormAlert, ListSkeleton, QueryState, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agencyFirmApi, ARREARS_BUCKET, recentMonths, type KpiReport } from '@/lib/api/agencyFirm';
import { formatNaira } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const rate = (v: number | null) => (v === null ? '—' : `${v}%`);

/** The firm's performance over a range of months, as owners would judge it. */
export default function AgencyPerformance() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [months] = useState(() => recentMonths(12));
  const [from, setFrom] = useState(months[2].value);
  const [to, setTo] = useState(months[0].value);
  const valid = from <= to;
  const q = useQuery({
    queryKey: qk.agency.kpis(from, to),
    queryFn: () => agencyFirmApi.kpis(from, to),
    enabled: valid,
    placeholderData: keepPreviousData,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title="Performance"
        subtitle={q.data?.scope.name ?? 'Collection, arrears, repairs, payouts, retention'}
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <ChipSelect label="From" options={[...months].reverse()} value={from} onChange={setFrom} />
        <ChipSelect label="To" options={[...months].reverse()} value={to} onChange={setTo} />
        {!valid ? (
          <FormAlert tone="warning" message="The first month must not be after the last." />
        ) : (
          <QueryState query={q} skeleton={<ListSkeleton rows={4} variant="card" height={100} />}>
            <Report r={q.data!} />
          </QueryState>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  const { spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="heading">{title}</Text>
      {rows.map(([label, value]) => (
        <View
          key={label}
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}
        >
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {label}
          </Text>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {value}
          </Text>
        </View>
      ))}
    </Card>
  );
}

function Report({ r }: { r: KpiReport }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Section
        title="Rent collection"
        rows={[
          [
            'Collected of billed',
            `${formatNaira(r.collection.collected)} of ${formatNaira(r.collection.billed)}`,
          ],
          ['Collection rate', rate(r.collection.collectionRate)],
          ['Paid on time', rate(r.collection.onTimeRate)],
        ]}
      />
      <Section
        title="Arrears"
        rows={[
          [
            'Total',
            `${formatNaira(r.arrears.total)} across ${r.arrears.tenancies} tenanc${r.arrears.tenancies === 1 ? 'y' : 'ies'}`,
          ],
          ...r.arrears.buckets.map(
            (b) => [ARREARS_BUCKET[b.key] ?? b.key, formatNaira(b.amount)] as [string, string]
          ),
        ]}
      />
      <Section
        title="Occupancy"
        rows={[
          ['Occupied', `${r.occupancy.occupiedUnits} of ${r.occupancy.units} units`],
          ['Occupancy rate', rate(r.occupancy.occupancyRate)],
          ['Properties', String(r.occupancy.properties)],
        ]}
      />
      <Section
        title="Maintenance"
        rows={[
          ['Raised · resolved', `${r.maintenance.raised} · ${r.maintenance.resolved}`],
          [
            'Median first response',
            r.maintenance.medianResponseHours === null
              ? '—'
              : `${r.maintenance.medianResponseHours} h`,
          ],
          ['Responded on time', rate(r.maintenance.responseOnTimeRate)],
          [
            'Median time to resolve',
            r.maintenance.medianResolutionDays === null
              ? '—'
              : `${r.maintenance.medianResolutionDays} days`,
          ],
          ['Resolved on time', rate(r.maintenance.resolutionOnTimeRate)],
          ['Open past target', String(r.maintenance.openPastTarget)],
        ]}
      />
      <Section
        title="Owner payouts"
        rows={[
          ['Statements', String(r.payouts.statements)],
          [`Paid within ${r.payoutTargetDays} days`, rate(r.payouts.onTimeRate)],
          [
            'Average days to pay',
            r.payouts.averageDaysToPay === null ? '—' : String(r.payouts.averageDaysToPay),
          ],
          ['Overdue', String(r.payouts.overdue)],
        ]}
      />
      <Section
        title="Owner retention"
        rows={[
          ['Retained', `${r.retention.retained} of ${r.retention.startingOwners}`],
          ['Retention rate', rate(r.retention.retentionRate)],
          ['Lost (by owner’s choice)', `${r.retention.lost} (${r.retention.lostByOwnerChoice})`],
          ['Gained', String(r.retention.gained)],
        ]}
      />
    </View>
  );
}
