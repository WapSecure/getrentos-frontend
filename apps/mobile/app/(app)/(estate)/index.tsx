import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Megaphone,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  WalletCards,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Price,
  PressableScale,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BalanceVisibilityButton } from '@/components/dashboard/BalanceVisibilityButton';
import { RevenueTrendChart } from '@/components/landlord/RevenueTrendChart';
import { isUpgradeError } from '@/components/host/HostUI';
import {
  AnnouncementCard,
  AnnouncementSheet,
  EstateSwitcherSheet,
  HouseholdSheet,
} from '@/components/estate/EstateUI';
import { useEstate } from '@/hooks/useEstate';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';
import { estateManagerApi, isFreeEstate } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';

type SheetKind = 'switch' | 'household' | 'announce' | null;

/**
 * The office at a glance: which dues are late, what was collected, and the
 * three things a manager does most (charge, add a home, tell everyone).
 */
export default function EstateHome() {
  const { colors, spacing, radius } = useTheme();
  const { visible: showMoney, toggle: toggleMoney } = useMonetaryVisibility();
  const { estate, estateId, estates, select, isPending, isError, refetch, isRefetching } =
    useEstate();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const free = isFreeEstate(estate);

  // What is late. One row is enough to read the count, on every plan.
  const overdue = useQuery({
    queryKey: qk.estateManager.attention(estateId),
    queryFn: () => estateManagerApi.dues(estateId, { status: 'OVERDUE', pageSize: 1 }),
    enabled: !!estateId,
  });
  // Money totals are Pro: don't ask for what the estate hasn't bought.
  const stats = useQuery({
    queryKey: qk.estateManager.dashboard(estateId),
    queryFn: () => estateManagerApi.dashboard(estateId),
    enabled: !!estateId && !free,
    retry: (n, e) => !isUpgradeError(e) && n < 2,
  });
  const trend = useQuery({
    queryKey: qk.estateManager.duesTrend(estateId),
    queryFn: () => estateManagerApi.duesTrend(estateId),
    enabled: !!estateId && !free && !!stats.data,
  });
  const announcements = useQuery({
    queryKey: qk.estateManager.announcements(estateId),
    queryFn: () => estateManagerApi.announcements(estateId),
    enabled: !!estateId,
  });

  const locked = free || isUpgradeError(stats.error);
  const late = overdue.data?.total ?? 0;
  const refresh = () => {
    void refetch();
    void overdue.refetch();
    void stats.refetch();
    void trend.refetch();
    void announcements.refetch();
  };

  const header = (
    <Pressable
      onPress={() => setSheet('switch')}
      disabled={estates.length < 2}
      accessibilityRole={estates.length > 1 ? 'button' : undefined}
      accessibilityLabel={
        estate
          ? `${estate.name}${estates.length > 1 ? '. Switch estate' : ''}`
          : 'Estate management'
      }
    >
      <DashboardHeader
        eyebrow="Estate office"
        title={estate?.name ?? 'Estate management'}
        roleBadge="EM"
        subtitle={
          estate
            ? `${[estate.city, estate.state].filter(Boolean).join(', ')} · ${estate.householdCount} ${estate.householdCount === 1 ? 'household' : 'households'}`
            : 'Community operations'
        }
        accessory={
          estates.length > 1 ? <ChevronDown size={20} color={colors.mutedForeground} /> : null
        }
      />
    </Pressable>
  );

  if (isError) {
    return (
      <Screen refreshing={isRefetching} onRefresh={refresh}>
        {header}
        <ErrorState title="We couldn't load your estates" onRetry={refresh} />
      </Screen>
    );
  }
  if (isPending) {
    return (
      <Screen>
        {header}
        <Skeleton height={120} radius={radius.lg} />
        <Skeleton height={160} radius={radius.lg} />
      </Screen>
    );
  }
  if (!estate) {
    return (
      <Screen refreshing={isRefetching} onRefresh={refresh}>
        {header}
        <EmptyState
          icon={<Building2 size={34} color={colors.mutedForeground} />}
          title="No estate yet"
          description="Set your estate up on the GetRentos website (its gates, plan and payout details). It then appears here to run from your phone."
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={isRefetching || overdue.isRefetching} onRefresh={refresh}>
      {header}

      {late ? (
        <PressableScale
          onPress={() =>
            router.push({ pathname: '/(app)/(estate)/dues', params: { view: 'OVERDUE' } })
          }
          accessibilityRole="button"
          accessibilityLabel={`${late} ${late === 1 ? 'due is' : 'dues are'} overdue. Review`}
        >
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              borderWidth: 1,
              borderColor: colors.destructive,
            }}
          >
            <CircleAlert size={20} color={colors.destructive} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {late} overdue {late === 1 ? 'due' : 'dues'}
              </Text>
              <Text variant="caption" color="mutedForeground">
                See who owes and record what’s been paid
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Card>
        </PressableScale>
      ) : null}

      {locked ? (
        <PressableScale
          onPress={() => router.push('/(app)/billing')}
          accessibilityRole="button"
          accessibilityLabel="Collection totals and trends are part of Pro. See plans."
        >
          <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Sparkles size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">See what you’ve collected</Text>
              <Text variant="caption" color="mutedForeground">
                Monthly totals, what’s outstanding and the trend are part of Pro
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Card>
        </PressableScale>
      ) : (
        <Card
          elevated
          accessible
          accessibilityLabel={
            stats.isPending
              ? 'Loading collection totals'
              : showMoney
                ? `Collected this month, ${Math.round(stats.data?.duesCollectedThisMonth ?? 0).toLocaleString('en-NG')} naira. Outstanding, ${Math.round(stats.data?.duesOutstanding ?? 0).toLocaleString('en-NG')} naira.`
                : 'Collection totals hidden'
          }
          style={{ gap: spacing.xs }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              Collected this month
            </Text>
            <BalanceVisibilityButton visible={showMoney} onToggle={toggleMoney} />
          </View>
          {stats.isPending ? (
            <Skeleton height={30} width="55%" />
          ) : stats.isError ? (
            <Text variant="callout" color="mutedForeground">
              Couldn’t load the totals. Pull down to retry.
            </Text>
          ) : showMoney ? (
            <Price amount={stats.data.duesCollectedThisMonth} variant="title" />
          ) : (
            <Text variant="title">••••••</Text>
          )}
          {stats.data ? (
            <Text variant="caption" color="mutedForeground">
              {showMoney
                ? `₦${Math.round(stats.data.duesOutstanding).toLocaleString('en-NG')} still outstanding`
                : 'Outstanding hidden'}
            </Text>
          ) : null}
          {(trend.data?.length ?? 0) > 1 && trend.data!.some((p) => p.value > 0) ? (
            <View style={{ marginTop: spacing.sm }}>
              <RevenueTrendChart points={trend.data!} />
            </View>
          ) : null}
        </Card>
      )}

      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Quick actions" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <QuickAction
            label="Charge dues"
            Icon={WalletCards}
            onPress={() => router.push('/(app)/estate-charge')}
          />
          <QuickAction
            label="Add a household"
            Icon={UserPlus}
            onPress={() => setSheet('household')}
          />
          <QuickAction label="Announce" Icon={Megaphone} onPress={() => setSheet('announce')} />
          <QuickAction
            label="Late fee rules"
            Icon={SlidersHorizontal}
            onPress={() =>
              router.push({ pathname: '/(app)/(estate)/dues', params: { settings: '1' } })
            }
          />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Announcements"
          actionLabel={announcements.data?.items.length ? 'See all' : undefined}
          onAction={() => router.push('/(app)/estate-announcements')}
        />
        {announcements.isPending ? (
          <Skeleton height={84} radius={radius.lg} />
        ) : announcements.data?.items.length ? (
          announcements.data.items
            .slice(0, 2)
            .map((a) => (
              <AnnouncementCard
                key={a.id}
                a={a}
                onPress={() => router.push('/(app)/estate-announcements')}
              />
            ))
        ) : (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Megaphone size={20} color={colors.mutedForeground} />
            <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
              Nothing posted yet.
            </Text>
            <Text
              variant="callout"
              color="primary"
              style={{ fontWeight: '700' }}
              onPress={() => setSheet('announce')}
              accessibilityRole="button"
            >
              Post one
            </Text>
          </Card>
        )}
      </View>

      <EstateSwitcherSheet
        open={sheet === 'switch'}
        onClose={() => setSheet(null)}
        estates={estates}
        currentId={estateId}
        onSelect={select}
      />
      <HouseholdSheet
        open={sheet === 'household'}
        onClose={() => setSheet(null)}
        estateId={estateId}
      />
      <AnnouncementSheet
        open={sheet === 'announce'}
        onClose={() => setSheet(null)}
        estateId={estateId}
        households={estate.householdCount}
      />
    </Screen>
  );
}

function QuickAction({
  label,
  Icon,
  onPress,
}: {
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexBasis: '48%',
        flexGrow: 1,
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Icon size={18} color={colors.primary} />
      <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
        {label}
      </Text>
    </PressableScale>
  );
}
