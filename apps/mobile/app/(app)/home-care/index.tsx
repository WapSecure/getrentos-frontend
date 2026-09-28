import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  CalendarClock,
  ChevronRight,
  History,
  Plus,
  Siren,
  Timer,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { ErrorState, IconButton, Price, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { homeCareApi } from '@/lib/api/homeCare';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { isUpgradeError } from '@/components/host/HostUI';
import { WorkOrderCard } from '@/components/homecare/WorkOrderCard';
import { HomeCareProGate } from '@/components/homecare/HomeCareProGate';

/**
 * Keeping the homes in shape: what's broken, what's due, and what's overdue,
 * across every property, with the work that needs you first.
 */
export default function HomeCare() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const dashboard = useQuery({ queryKey: qk.homeCare.dashboard, queryFn: homeCareApi.dashboard });
  const gated = isUpgradeError(dashboard.error);
  const open = useQuery({
    queryKey: qk.homeCare.workOrders('open'),
    queryFn: async () => {
      const [a, b, c] = await Promise.all([
        homeCareApi.workOrders('SUBMITTED'),
        homeCareApi.workOrders('ASSIGNED'),
        homeCareApi.workOrders('IN_PROGRESS'),
      ]);
      return [...a.items, ...b.items, ...c.items];
    },
    enabled: !!dashboard.data,
  });
  const d = dashboard.data;

  // Emergencies and anything waiting on a decision first, then the clock.
  const attention = (open.data ?? [])
    .filter((w) => w.isEmergency || (w.approvalRequired && !w.approvedAt) || !w.assignedVendor)
    .sort(
      (a, b) =>
        Number(!!b.isEmergency) - Number(!!a.isEmergency) ||
        (a.resolutionDueAt ?? '9').localeCompare(b.resolutionDueAt ?? '9')
    )
    .slice(0, 4);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={dashboard.isRefetching}
          onRefresh={() => {
            dashboard.refetch();
            open.refetch();
          }}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.xl,
      }}
    >
      <DetailHeader
        eyebrow="Home care"
        title="Maintenance"
        subtitle="Repairs, assets and upkeep across your homes"
        onBack={() => router.back()}
        accessory={
          d ? (
            <IconButton
              accessibilityLabel="New work order"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => router.push('/(app)/home-care/new-work-order')}
            />
          ) : null
        }
      />
      {gated ? (
        <HomeCareProGate />
      ) : dashboard.isError && !d ? (
        <ErrorState onRetry={() => dashboard.refetch()} />
      ) : !d ? (
        <>
          <Skeleton height={160} radius={radius.lg} />
          <Skeleton height={120} radius={radius.lg} />
        </>
      ) : (
        <>
          <MetricGrid
            loading={false}
            metrics={[
              {
                label: 'Open jobs',
                value: d.openWorkOrders,
                Icon: Wrench,
                onPress: () => router.push('/(app)/home-care/work-orders'),
              },
              {
                label: 'Overdue',
                value: d.overdue,
                Icon: AlertTriangle,
                onPress: () => router.push('/(app)/home-care/work-orders'),
              },
              {
                label: 'Awaiting approval',
                value: d.approvalQueue,
                Icon: BadgeCheck,
                onPress: () => router.push('/(app)/home-care/work-orders'),
              },
              {
                label: 'Emergencies',
                value: d.unacknowledgedEmergencies,
                Icon: Siren,
                onPress: () => router.push('/(app)/home-care/work-orders'),
              },
            ]}
          />

          <View style={{ gap: spacing.md }}>
            <Text variant="heading" accessibilityRole="header">
              Needs you
            </Text>
            {open.isPending ? (
              <Skeleton height={110} radius={radius.lg} />
            ) : attention.length ? (
              attention.map((w) => <WorkOrderCard key={w.id} w={w} />)
            ) : (
              <Text variant="callout" color="mutedForeground">
                Nothing waiting on you. Every open job has a vendor and a budget.
              </Text>
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Tile
              Icon={Wrench}
              label="Work orders"
              hint={`${d.openWorkOrders} open`}
              onPress={() => router.push('/(app)/home-care/work-orders')}
            />
            <Tile
              Icon={Boxes}
              label="Assets"
              hint={`${d.totalAssets} tracked${d.assetsNeedingService ? ` · ${d.assetsNeedingService} need service` : ''}`}
              onPress={() => router.push('/(app)/home-care/assets')}
            />
            <Tile
              Icon={CalendarClock}
              label="Preventive maintenance"
              hint={d.plansDue ? `${d.plansDue} due` : 'Servicing on a schedule'}
              onPress={() => router.push('/(app)/home-care/plans')}
            />
            <Tile
              Icon={Timer}
              label="Response times"
              hint="How fast each priority must be handled"
              onPress={() => router.push('/(app)/home-care/service-targets')}
            />
            <Tile
              Icon={History}
              label="Activity"
              hint="Everything that happened, newest first"
              onPress={() => router.push('/(app)/home-care/activity')}
            />
          </View>

          {d.approvedSpend ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                Approved spend so far
              </Text>
              <Price amount={d.approvedSpend} variant="bodyStrong" />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function Tile({
  Icon,
  label,
  hint,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: pressed ? colors.secondary : colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={19} color={colors.accentForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="caption" color="mutedForeground">
          {hint}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
