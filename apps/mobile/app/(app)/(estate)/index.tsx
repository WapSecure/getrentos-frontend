import { formatLocation } from '@sureground/shared';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Megaphone,
  MessageCircle,
  MessageCircleQuestion,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
  WalletCards,
  type SgIcon,
} from '@sureground/icons/native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LinkButton,
  Price,
  PressableScale,
  Screen,
  SectionHeader,
  Skeleton,
  StatGroup,
  StatGroupSkeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
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
import { estateManagerApi, isFreeEstate, isOpenItem } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';
import { estateOfficeApi } from '@/lib/api/estateOfficeMessages';

type SheetKind = 'switch' | 'household' | 'announce' | null;

export default function EstateHome() {
  const { colors, spacing, radius } = useTheme();
  const { visible: showMoney, toggle: toggleMoney } = useMonetaryVisibility();
  const { estate, estateId, estates, select, isPending, isError, refetch, isRefetching } =
    useEstate();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const free = isFreeEstate(estate);

  // One row is enough to read the late count, on every plan.
  const overdue = useQuery({
    queryKey: qk.estateManager.attention(estateId),
    queryFn: () => estateManagerApi.dues(estateId, { status: 'OVERDUE', pageSize: 1 }),
    enabled: !!estateId,
  });
  const notifications = useQuery({
    queryKey: qk.estateManager.notifications,
    queryFn: estateManagerApi.notifications,
  });
  // Safety is on every plan: the incident count in the Pro stats must not be the only place a panic alarm shows.
  const incidents = useQuery({
    queryKey: qk.estateManager.incidents(estateId),
    queryFn: () => estateManagerApi.incidents(estateId),
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

  const residentThreads = useQuery({
    queryKey: qk.estateManager.residentThreads(estateId),
    queryFn: () => estateOfficeApi.threads(estateId),
    enabled: !!estateId,
  });
  const locked = free || isUpgradeError(stats.error);
  const late = overdue.data?.total ?? 0;
  const unread = (notifications.data ?? []).filter((n) => !n.read).length;
  const awaitingReply = residentThreads.data?.filter((t) => t.unread).length ?? 0;
  const urgentIncidents =
    incidents.data?.filter(
      (i) => isOpenItem(i.status) && (i.priority === 'critical' || i.priority === 'high')
    ).length ?? 0;
  const refresh = () => {
    void refetch();
    void overdue.refetch();
    void residentThreads.refetch();
    void incidents.refetch();
    void notifications.refetch();
    void stats.refetch();
    void trend.refetch();
    void announcements.refetch();
  };

  const header = (
    <DashboardHeader
      eyebrow="Estate office"
      title={estate?.name ?? 'Estate management'}
      roleBadge="Estate manager"
      subtitle={
        estate
          ? `${formatLocation(estate.city, estate.state)} · ${estate.householdCount} ${estate.householdCount === 1 ? 'household' : 'households'}`
          : 'Community operations'
      }
      // Always openable once there is an estate: the sheet also adds another.
      onTitlePress={estate ? () => setSheet('switch') : undefined}
      titleAccessibilityLabel={
        estate
          ? `${estate.name}. ${estates.length > 1 ? 'Switch estate' : 'Your estates'}`
          : undefined
      }
      accessory={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {estateId ? (
            <IconButton
              onPress={() =>
                router.push({ pathname: '/(app)/ask', params: { persona: 'estate', estateId } })
              }
              accessibilityLabel="Ask Sureground"
              icon={<MessageCircleQuestion size={21} color={colors.foreground} />}
            />
          ) : null}
          <IconButton
            onPress={() => router.push('/(app)/estate-notifications')}
            // IconButton already appends ", N unread" from the badge.
            accessibilityLabel="Notifications"
            badge={unread}
            icon={<Bell size={21} color={colors.foreground} />}
          />
          {estates.length > 1 ? (
            <Pressable
              onPress={() => setSheet('switch')}
              accessibilityRole="button"
              accessibilityLabel="Switch estate"
              hitSlop={8}
            >
              <ChevronDown size={20} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      }
    />
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
          description="Set up your estate (its name, address and gates) and run it from here."
          action={
            <Button label="Set up your estate" onPress={() => router.push('/(app)/estate-setup')} />
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={isRefetching || overdue.isRefetching || incidents.isRefetching}
      onRefresh={refresh}
    >
      {header}

      {urgentIncidents ? (
        <PressableScale
          onPress={() => router.push('/(app)/estate-incidents')}
          accessibilityRole="button"
          accessibilityLabel={`${urgentIncidents} urgent ${urgentIncidents === 1 ? 'incident is' : 'incidents are'} open. Review`}
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
            <ShieldAlert size={20} color={colors.destructive} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {urgentIncidents} urgent {urgentIncidents === 1 ? 'incident' : 'incidents'} open
              </Text>
              <Text variant="caption" color="mutedForeground">
                High or critical reports waiting on the office
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Card>
        </PressableScale>
      ) : null}

      {awaitingReply ? (
        <PressableScale
          onPress={() => router.push('/(app)/estate-resident-messages')}
          accessibilityRole="button"
          accessibilityLabel={`${awaitingReply} ${awaitingReply === 1 ? 'household is' : 'households are'} waiting for a reply. Open resident messages`}
        >
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <MessageCircle size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {awaitingReply} {awaitingReply === 1 ? 'household is' : 'households are'} waiting
                for a reply
              </Text>
              <Text variant="caption" color="mutedForeground">
                Messages from residents to the estate office
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Card>
        </PressableScale>
      ) : null}

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
          ) : !stats.data ? (
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

      {locked ? null : stats.isPending ? (
        <StatGroupSkeleton groups={[4]} />
      ) : stats.data ? (
        <StatGroup
          title="Estate"
          items={[
            {
              label: 'Households',
              value: stats.data.totalHouseholds,
              onPress: () => router.push('/(app)/(estate)/households'),
            },
            {
              label: 'Open incidents',
              value: stats.data.openIncidents,
              attention: stats.data.openIncidents > 0,
              onPress: () => router.push('/(app)/estate-incidents'),
            },
            {
              label: 'Open maintenance',
              value: stats.data.openMaintenanceTickets,
              attention: stats.data.openMaintenanceTickets > 0,
              onPress: () => router.push('/(app)/estate-maintenance'),
            },
            {
              label: 'Pending violations',
              value: stats.data.pendingViolations,
              attention: stats.data.pendingViolations > 0,
              onPress: () => router.push('/(app)/estate-violations'),
            },
          ]}
        />
      ) : null}

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
            <LinkButton label="Post one" onPress={() => setSheet('announce')} />
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
  Icon: SgIcon;
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
