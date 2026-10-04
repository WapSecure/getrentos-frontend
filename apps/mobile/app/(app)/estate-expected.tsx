import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, CalendarCheck, Sparkles } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { isUpgradeError } from '@/components/host/HostUI';
import { useEstate } from '@/hooks/useEstate';
import { gatemanApi } from '@/lib/api/gateman';
import { formatTime } from '@/lib/format';
import { qk } from '@/lib/query/keys';

/**
 * Who the estate expects today: visitors, contractors and parcels. A planning
 * view only; nothing here admits anybody, the pass code at the gate does.
 */
export default function EstateExpected() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { estate, estateId } = useEstate();
  const query = useQuery({
    queryKey: qk.estateManager.expectedToday(estateId),
    queryFn: () => gatemanApi.getExpectedToday(estateId),
    enabled: !!estateId,
    retry: (n, e) => !isUpgradeError(e) && n < 2,
  });
  const d = query.data;
  const empty = d && !d.visitors.length && !d.contractors.length && !d.parcels.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
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
        title="Expected today"
        subtitle={
          d ? `${d.tally.label} · as of ${formatTime(d.asOf)}` : 'Who the estate is expecting'
        }
        onBack={() => router.back()}
      />
      {isUpgradeError(query.error) ? (
        <Card elevated style={{ gap: spacing.md }}>
          <Sparkles size={22} color={colors.primary} />
          <Text variant="heading">Expected today is part of Enterprise</Text>
          {[
            'Every visitor, contractor and parcel due today in one list',
            'What must arrive before the day ends, flagged',
            'The same list your guards see at the gate',
          ].map((p) => (
            <View key={p} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <BadgeCheck size={16} color={colors.success} style={{ marginTop: 2 }} />
              <Text variant="callout" style={{ flex: 1 }}>
                {p}
              </Text>
            </View>
          ))}
          <Button label="See plans" onPress={() => router.push('/(app)/billing')} />
        </Card>
      ) : query.isError && !d ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !d ? (
        <Skeleton height={220} radius={radius.lg} />
      ) : empty ? (
        <EmptyState
          icon={<CalendarCheck size={34} color={colors.mutedForeground} />}
          title="Nobody expected today"
          description="Visitors residents invite, contractors on a standing pass and parcels on the way show up here."
        />
      ) : (
        <>
          <Group
            title="Visitors"
            rows={d.visitors.map((v) => ({
              id: v.id,
              title: v.visitorName,
              where: `${v.unitLabel} · ${v.residentName}`,
              note: [v.purpose, v.sourceLabel].filter(Boolean).join(' · '),
              deadline: v.deadlineLabel,
              today: v.deadlineToday,
            }))}
          />
          <Group
            title="Contractors"
            rows={d.contractors.map((c) => ({
              id: c.id,
              title: [c.name, c.company].filter(Boolean).join(', '),
              where: c.unitLabel ?? 'Estate-wide',
              note: [c.trade, c.hoursLabel, c.daysLabel].filter(Boolean).join(' · '),
              deadline: c.deadlineLabel,
              today: c.deadlineToday,
            }))}
          />
          <Group
            title="Parcels"
            rows={d.parcels.map((p) => ({
              id: p.id,
              title: p.courier,
              where: `${p.unitLabel} · ${p.residentName}`,
              note: p.description ?? '',
              deadline: p.deadlineLabel,
              today: p.deadlineToday,
            }))}
          />
          <Text variant="caption" color="mutedForeground" center>
            A planning list. Nothing here lets anyone in; the pass code at the gate does.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function Group({
  title,
  rows,
}: {
  title: string;
  rows: {
    id: string;
    title: string;
    where: string;
    note: string;
    deadline: string;
    today: boolean;
  }[];
}) {
  const { colors, spacing } = useTheme();
  if (!rows.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" accessibilityRole="header">
        {title} · {rows.length}
      </Text>
      {rows.map((r) => (
        <Card
          key={r.id}
          elevated
          accessible
          accessibilityLabel={`${r.title}, ${r.where}. ${r.note}. ${r.deadline}`}
          style={{ gap: 2 }}
        >
          <Text variant="bodyStrong" numberOfLines={1}>
            {r.title}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {r.where}
          </Text>
          {r.note ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={2}>
              {r.note}
            </Text>
          ) : null}
          <Text
            variant="caption"
            style={{
              color: r.today ? colors.warning : colors.mutedForeground,
              fontWeight: r.today ? '700' : '400',
            }}
          >
            {r.deadline}
          </Text>
        </Card>
      ))}
    </View>
  );
}
