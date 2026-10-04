import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Gavel,
  ShieldAlert,
  ShieldBan,
  Siren,
  Ticket,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  PressableScale,
  Screen,
  SectionHeader,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useEstate } from '@/hooks/useEstate';
import { estateManagerApi, isOpenItem } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';

/**
 * Safety and the gate in one place: a live emergency first, then each queue
 * with how much is waiting in it.
 */
export default function EstateOperations() {
  const { colors, spacing } = useTheme();
  const { estate, estateId } = useEstate();
  const on = { enabled: !!estateId };

  const muster = useQuery({
    queryKey: qk.estateManager.activeMuster(estateId),
    queryFn: () => estateManagerApi.activeMuster(estateId),
    ...on,
  });
  const incidents = useQuery({
    queryKey: qk.estateManager.incidents(estateId),
    queryFn: () => estateManagerApi.incidents(estateId),
    ...on,
  });
  const maintenance = useQuery({
    queryKey: qk.estateManager.maintenance(estateId),
    queryFn: () => estateManagerApi.maintenance(estateId),
    ...on,
  });
  const violations = useQuery({
    queryKey: qk.estateManager.violations(estateId),
    queryFn: () => estateManagerApi.violations(estateId),
    ...on,
  });
  const inside = useQuery({
    queryKey: [...qk.estateManager.visitorPasses(estateId, 'CHECKED_IN'), 'count'],
    queryFn: () => estateManagerApi.visitorPasses(estateId, { status: 'CHECKED_IN' }),
    ...on,
  });
  const watch = useQuery({
    queryKey: [...qk.estateManager.watchlist(estateId, 'ACTIVE'), 'count'],
    queryFn: () => estateManagerApi.watchlist(estateId, 'ACTIVE'),
    ...on,
  });

  const openCount = (list?: { status: string }[]) =>
    list ? list.filter((i) => isOpenItem(i.status)).length : undefined;
  const critical = incidents.data?.filter(
    (i) => isOpenItem(i.status) && (i.priority === 'critical' || i.priority === 'high')
  ).length;
  const live = muster.data;

  const refresh = () => {
    void muster.refetch();
    void incidents.refetch();
    void maintenance.refetch();
    void violations.refetch();
    void inside.refetch();
    void watch.refetch();
  };

  return (
    <Screen refreshing={incidents.isRefetching || muster.isRefetching} onRefresh={refresh}>
      <DashboardHeader
        eyebrow="Operations"
        title="Safety & gate"
        subtitle={estate?.name ?? 'Your estate'}
      />
      {!estateId ? (
        <EmptyState
          icon={<ShieldAlert size={34} color={colors.mutedForeground} />}
          title="No estate yet"
          description="Operations appear here once your estate is set up."
        />
      ) : (
        <>
          <PressableScale
            onPress={() => router.push('/(app)/estate-emergency')}
            accessibilityRole="button"
            accessibilityLabel={
              live
                ? `${live.kindLabel} emergency in progress. ${live.tally.unaccounted} not yet accounted for, ${live.tally.needsHelp} need help. Open the roll call`
                : 'Declare an emergency and take a roll call'
            }
          >
            <Card
              elevated
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: live ? colors.destructive : colors.card,
              }}
            >
              <Siren size={22} color={live ? colors.destructiveForeground : colors.destructive} />
              <View style={{ flex: 1 }}>
                <Text
                  variant="bodyStrong"
                  style={{ color: live ? colors.destructiveForeground : colors.foreground }}
                >
                  {live ? `${live.kindLabel} emergency in progress` : 'Emergency'}
                </Text>
                <Text
                  variant="caption"
                  style={{ color: live ? colors.destructiveForeground : colors.mutedForeground }}
                >
                  {live
                    ? `${live.tally.unaccounted} missing · ${live.tally.needsHelp} need help · ${live.tally.accountedFor} safe`
                    : 'Alert every resident and take a roll call'}
                </Text>
              </View>
              <ChevronRight
                size={18}
                color={live ? colors.destructiveForeground : colors.mutedForeground}
              />
            </Card>
          </PressableScale>

          <View style={{ gap: spacing.md }}>
            <SectionHeader title="Waiting on the office" />
            <Row
              Icon={ShieldAlert}
              label="Incidents"
              count={openCount(incidents.data)}
              note={
                critical ? `${critical} high or critical` : 'Reported by residents and the gate'
              }
              urgent={!!critical}
              href="/(app)/estate-incidents"
            />
            <Row
              Icon={Wrench}
              label="Maintenance"
              count={openCount(maintenance.data)}
              note="Repairs residents have asked for"
              href="/(app)/estate-maintenance"
            />
            <Row
              Icon={Gavel}
              label="Violations"
              count={openCount(violations.data)}
              note="Record, warn and close"
              href="/(app)/estate-violations"
            />
          </View>

          <View style={{ gap: spacing.md }}>
            <SectionHeader title="The gate" />
            <Row
              Icon={Ticket}
              label="Visitors"
              count={inside.data?.total}
              countLabel="inside"
              note="Who’s in, who’s expected, issue a pass"
              href="/(app)/estate-visitors"
            />
            <Row
              Icon={ShieldBan}
              label="Watch list"
              count={watch.data?.total}
              countLabel="listed"
              note="Who the gate should stop or flag"
              href="/(app)/estate-watchlist"
            />
          </View>
        </>
      )}
    </Screen>
  );
}

function Row({
  Icon,
  label,
  count,
  countLabel = 'open',
  note,
  urgent,
  href,
}: {
  Icon: LucideIcon;
  label: string;
  /** Undefined while loading. */
  count?: number;
  countLabel?: string;
  note: string;
  urgent?: boolean;
  href: Href;
}) {
  const { colors, spacing } = useTheme();
  return (
    <PressableScale
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={`${label}${count !== undefined ? `, ${count} ${countLabel}` : ''}. ${note}`}
    >
      <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Icon size={20} color={urgent ? colors.destructive : colors.primary} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{label}</Text>
          <Text
            variant="caption"
            style={{ color: urgent ? colors.destructive : colors.mutedForeground }}
          >
            {note}
          </Text>
        </View>
        {count !== undefined ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              variant="heading"
              style={{ color: count ? colors.foreground : colors.mutedForeground }}
            >
              {count}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {countLabel}
            </Text>
          </View>
        ) : null}
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Card>
    </PressableScale>
  );
}
