import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  FileSignature,
  Handshake,
  Megaphone,
  Plus,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Card,
  ErrorState,
  IconButton,
  Price,
  PressableScale,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { BalanceVisibilityButton } from '@/components/dashboard/BalanceVisibilityButton';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';
import { isUpgradeError } from '@/components/host/HostUI';
import {
  AddLeadSheet,
  InviteClientSheet,
  ScheduleViewingSheet,
  ViewingRow,
} from '@/components/realtor/RealtorUI';
import { qk } from '@/lib/query/keys';
import { realtorApi, viewingBuckets } from '@/lib/api/realtor';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName, relativeTime } from '@/lib/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

type SheetKind = 'lead' | 'viewing' | 'invite' | null;

/**
 * The realtor's day: who they're showing round today, what's waiting on them
 * (new offers, new leads, pending clients), and what they've earned.
 */
export default function RealtorHome() {
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const { visible: showMoney, toggle: toggleMoney } = useMonetaryVisibility();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const dashboard = useQuery({ queryKey: qk.realtor.dashboard, queryFn: realtorApi.dashboard });
  const viewings = useQuery({
    queryKey: qk.realtor.viewings,
    queryFn: () => realtorApi.viewings(),
  });
  const offers = useQuery({ queryKey: qk.realtor.offers, queryFn: () => realtorApi.offers() });
  const leads = useQuery({
    queryKey: qk.realtor.leads('NEW'),
    queryFn: () => realtorApi.leads({ status: 'NEW' }),
  });
  const clients = useQuery({ queryKey: qk.realtor.clients, queryFn: () => realtorApi.clients() });
  const earnings = useQuery({
    queryKey: qk.realtor.payoutSummary,
    queryFn: realtorApi.payoutSummary,
    retry: (n, e) => !isUpgradeError(e) && n < 2,
  });
  const activity = useQuery({ queryKey: qk.realtor.activity, queryFn: realtorApi.activity });
  const notifications = useQuery({
    queryKey: qk.realtor.notifications,
    queryFn: realtorApi.notifications,
  });

  const d = dashboard.data;
  const unread = notifications.data?.items.filter((n) => !n.read).length ?? 0;
  const today = viewings.data ? viewingBuckets(viewings.data.items).today : [];
  const newOffers = offers.data?.items.filter((o) => o.status === 'SUBMITTED').length ?? 0;
  const newLeads = leads.data?.total ?? 0;
  const pendingClients = clients.data?.items.filter((c) => c.status === 'PENDING').length ?? 0;
  const proLocked = isUpgradeError(earnings.error);

  const refresh = () => {
    dashboard.refetch();
    viewings.refetch();
    offers.refetch();
    leads.refetch();
    clients.refetch();
    earnings.refetch();
    activity.refetch();
    notifications.refetch();
  };

  const header = (
    <DashboardHeader
      eyebrow={greeting()}
      title={firstName(profile?.legalName)}
      roleBadge="Realtor"
      subtitle={
        today.length
          ? `${today.length} ${today.length === 1 ? 'viewing' : 'viewings'} today`
          : 'Your clients, listings and deals'
      }
      accessory={
        <IconButton
          onPress={() => router.push('/(app)/realtor-notifications')}
          accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          badge={unread}
          icon={<Bell size={21} color={colors.foreground} />}
        />
      }
    />
  );

  if (dashboard.isError && !d) {
    return (
      <Screen refreshing={dashboard.isRefetching} onRefresh={refresh}>
        {header}
        <ErrorState
          title="We couldn't load your dashboard"
          description="Check your connection and try again."
          onRetry={refresh}
        />
      </Screen>
    );
  }

  const metrics = d
    ? [
        {
          label: 'Active clients',
          value: d.activeClients,
          Icon: Handshake,
          onPress: () => router.push('/(app)/realtor-clients'),
        },
        {
          label: 'Live listings',
          value: d.publishedListings,
          Icon: Megaphone,
          onPress: () => router.push('/(app)/(realtor)/listings'),
        },
        {
          label: 'Open leads',
          value: d.activeLeads,
          Icon: Users,
          onPress: () => router.push('/(app)/(realtor)/pipeline'),
        },
        {
          label: 'Viewings ahead',
          value: d.upcomingViewings,
          Icon: CalendarClock,
          onPress: () =>
            router.push({ pathname: '/(app)/(realtor)/pipeline', params: { tab: 'viewings' } }),
        },
      ]
    : [];

  type Nudge = { key: string; Icon: LucideIcon; title: string; body: string; go: () => void };
  const nudges = (
    [
      newOffers
        ? {
            key: 'offers',
            Icon: FileSignature,
            title: `${newOffers} new ${newOffers === 1 ? 'offer' : 'offers'}`,
            body: 'Review and counter for your client',
            go: () => router.push('/(app)/realtor-offers'),
          }
        : null,
      newLeads
        ? {
            key: 'leads',
            Icon: Users,
            title: `${newLeads} new ${newLeads === 1 ? 'lead' : 'leads'} to contact`,
            body: 'The first reply wins the client',
            go: () => router.push('/(app)/(realtor)/pipeline'),
          }
        : null,
      pendingClients
        ? {
            key: 'clients',
            Icon: Handshake,
            title: `${pendingClients} ${pendingClients === 1 ? 'invite' : 'invites'} awaiting approval`,
            body: 'Your client approves it from their account',
            go: () => router.push('/(app)/realtor-clients'),
          }
        : null,
    ] as (Nudge | null)[]
  ).filter((n): n is Nudge => !!n);

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={refresh}>
      {header}

      {nudges.map((n) => (
        <PressableScale
          key={n.key}
          onPress={n.go}
          accessibilityRole="button"
          accessibilityLabel={`${n.title}. ${n.body}`}
        >
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.accent,
            }}
          >
            <n.Icon size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{n.title}</Text>
              <Text variant="caption" color="mutedForeground">
                {n.body}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </Card>
        </PressableScale>
      ))}

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Today"
          actionLabel={viewings.data?.items.length ? 'All viewings' : undefined}
          onAction={() =>
            router.push({ pathname: '/(app)/(realtor)/pipeline', params: { tab: 'viewings' } })
          }
        />
        {viewings.isPending ? (
          <Skeleton height={84} radius={radius.lg} />
        ) : today.length ? (
          today.map((v) => (
            <ViewingRow
              key={v.id}
              v={v}
              showDate={false}
              onPress={() =>
                router.push({ pathname: '/(app)/(realtor)/pipeline', params: { tab: 'viewings' } })
              }
            />
          ))
        ) : (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <CalendarClock size={20} color={colors.mutedForeground} />
            <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
              No viewings today.
            </Text>
            <Text
              variant="callout"
              color="primary"
              style={{ fontWeight: '700' }}
              onPress={() => setSheet('viewing')}
              accessibilityRole="button"
            >
              Book one
            </Text>
          </Card>
        )}
      </View>

      <Earnings
        loading={earnings.isPending}
        locked={proLocked}
        available={earnings.data?.available ?? 0}
        pending={earnings.data?.pending ?? 0}
        showMoney={showMoney}
        onToggle={toggleMoney}
      />

      <MetricGrid metrics={metrics} loading={dashboard.isPending} />

      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Quick actions" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <QuickAction label="Add a lead" Icon={Plus} onPress={() => setSheet('lead')} />
          <QuickAction
            label="Book a viewing"
            Icon={CalendarClock}
            onPress={() => setSheet('viewing')}
          />
          <QuickAction label="Invite a client" Icon={UserPlus} onPress={() => setSheet('invite')} />
          <QuickAction
            label="Offers"
            Icon={FileSignature}
            badge={newOffers}
            onPress={() => router.push('/(app)/realtor-offers')}
          />
        </View>
      </View>

      {activity.data?.length ? (
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Recent activity" />
          <Card elevated padding="none">
            {activity.data.slice(0, 6).map((a, i) => (
              <View
                key={a.id}
                accessible
                accessibilityLabel={`${a.title}. ${a.description}, ${relativeTime(a.date)}`}
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: radius.full,
                    marginTop: 6,
                    backgroundColor: colors.primary,
                  }}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }}>
                    {a.title}
                  </Text>
                  <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                    {a.description} · {relativeTime(a.date)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <AddLeadSheet open={sheet === 'lead'} onClose={() => setSheet(null)} />
      <ScheduleViewingSheet open={sheet === 'viewing'} onClose={() => setSheet(null)} />
      <InviteClientSheet open={sheet === 'invite'} onClose={() => setSheet(null)} />
    </Screen>
  );
}

function Earnings({
  loading,
  locked,
  available,
  pending,
  showMoney,
  onToggle,
}: {
  loading: boolean;
  locked: boolean;
  available: number;
  pending: number;
  showMoney: boolean;
  onToggle: () => void;
}) {
  const { colors, spacing } = useTheme();
  if (locked) {
    return (
      <PressableScale
        onPress={() => router.push('/(app)/realtor-commissions')}
        accessibilityRole="button"
        accessibilityLabel="Commission tracking and payouts are part of Pro. See what’s included."
      >
        <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Wallet size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Get paid your commission here</Text>
            <Text variant="caption" color="mutedForeground">
              Commission tracking and withdrawals are part of Pro
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Card>
      </PressableScale>
    );
  }
  return (
    <PressableScale
      onPress={() => router.push('/(app)/realtor-commissions')}
      accessibilityRole="button"
      accessibilityLabel={
        loading
          ? 'Loading commission'
          : showMoney
            ? `Commission available, ${Math.round(available).toLocaleString('en-NG')} naira. ${Math.round(pending).toLocaleString('en-NG')} naira still in escrow. Open commissions`
            : 'Commission hidden. Open commissions'
      }
    >
      <Card elevated style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            Commission ready to withdraw
          </Text>
          <BalanceVisibilityButton visible={showMoney} onToggle={onToggle} />
        </View>
        {loading ? (
          <Skeleton height={30} width="50%" />
        ) : showMoney ? (
          <Price amount={available} variant="title" />
        ) : (
          <Text variant="title">••••••</Text>
        )}
        <Text variant="caption" color="mutedForeground">
          {pending > 0
            ? showMoney
              ? `₦${Math.round(pending).toLocaleString('en-NG')} more once escrow releases`
              : 'More on the way once escrow releases'
            : 'Earned when a sale you worked on closes'}
        </Text>
      </Card>
    </PressableScale>
  );
}

function QuickAction({
  label,
  Icon,
  onPress,
  badge,
}: {
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  badge?: number;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic={false}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} new` : label}
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
      {badge ? (
        <Text variant="caption" color="primary" style={{ fontWeight: '800' }}>
          {badge}
        </Text>
      ) : null}
    </PressableScale>
  );
}
