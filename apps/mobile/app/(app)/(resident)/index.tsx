import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  Contact,
  DoorOpen,
  KeyRound,
  Landmark,
  Megaphone,
  MessageCircleQuestion,
  Package,
  ReceiptText,
  TriangleAlert,
  Vote,
  Wrench,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Divider,
  IconButton,
  PressableScale,
  QueryState,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { relativeTime, firstName, formatNaira } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { EmergencyBanner } from '@/components/resident/EmergencyBanner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AttentionCard, dashboardGreeting } from '@/components/dashboard/DashboardParts';
import { notificationsApi } from '@/lib/api/notifications';
import { BalanceVisibilityButton } from '@/components/dashboard/BalanceVisibilityButton';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';

const QUICK_LINKS = [
  { href: '/(app)/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/(app)/visitor-passes', label: 'Visitor passes', icon: KeyRound },
  { href: '/(app)/amenities', label: 'Amenities', icon: CalendarCheck },
  { href: '/(app)/violations', label: 'Violations', icon: TriangleAlert },
  { href: '/(app)/deliveries', label: 'Deliveries', icon: Package },
  { href: '/(app)/directory', label: 'Directory', icon: Contact },
  { href: '/(app)/polls', label: 'Polls', icon: Vote },
  { href: '/(app)/committee', label: 'Committee', icon: Landmark },
] as const;

export default function ResidentHome() {
  const { colors, spacing, radius } = useTheme();
  const { visible: showMoney, toggle: toggleMoney } = useMonetaryVisibility();
  const { profile } = useAuth();

  const household = useQuery({
    queryKey: qk.resident.household,
    queryFn: () => residentApi.getMyHousehold(),
  });
  const announcements = useQuery({
    queryKey: qk.resident.announcements(1, 3),
    queryFn: () => residentApi.listAnnouncements(1, 3),
  });
  const dues = useQuery({
    queryKey: qk.resident.dues,
    queryFn: () => residentApi.listDues(1, 50),
  });

  const notifications = useQuery({
    queryKey: qk.renter.notifications(1, 30),
    queryFn: () => notificationsApi.list(1, 30),
  });
  const unreadCount = (notifications.data?.items ?? []).filter((n) => !n.read).length;
  // A walk-in has a ten-minute window, so keep polling while one is open.
  const passes = useQuery({
    queryKey: qk.resident.visitorPasses,
    queryFn: () => residentApi.listVisitorPasses(1, 50),
    refetchInterval: 30_000,
  });
  const waitingAtGate = (passes.data?.items ?? []).filter(
    (pass) =>
      pass.status === 'awaiting_approval' &&
      new Date(pass.expiresAt).getTime() > passes.dataUpdatedAt
  );

  const isRefreshing =
    household.isRefetching ||
    announcements.isRefetching ||
    dues.isRefetching ||
    passes.isRefetching ||
    notifications.isRefetching;
  const onRefresh = () => {
    household.refetch();
    announcements.refetch();
    dues.refetch();
    passes.refetch();
    notifications.refetch();
  };

  const recent = announcements.data?.items ?? [];
  // Passes the gate will still honour, for the visitors summary.
  const activePasses = (passes.data?.items ?? []).filter(
    (pass) =>
      pass.status === 'pending' || pass.status === 'approved' || pass.status === 'checked_in'
  );
  const insideNow = activePasses.filter((pass) => pass.status === 'checked_in').length;

  const outstanding = (dues.data?.items ?? [])
    .filter((d) => d.status === 'pending' || d.status === 'overdue' || d.status === 'processing')
    // `amount` already includes any late fee.
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Screen refreshing={isRefreshing} onRefresh={onRefresh}>
      <EmergencyBanner />

      <DashboardHeader
        eyebrow={dashboardGreeting()}
        title={firstName(profile?.legalName)}
        roleBadge="RS"
        subtitle={
          household.data
            ? `${household.data.estate.name} · Unit ${household.data.unitLabel}`
            : 'Everything around your home, in one place'
        }
        accessory={
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <IconButton
              onPress={() =>
                router.push({ pathname: '/(app)/ask', params: { persona: 'resident' } })
              }
              accessibilityLabel="Ask Sureground"
              icon={<MessageCircleQuestion size={21} color={colors.foreground} />}
            />
            <IconButton
              onPress={() => router.push('/(app)/notifications')}
              // IconButton already appends ", N unread" from the badge, so the label must not repeat the count.
              accessibilityLabel="Notifications"
              badge={unreadCount}
              icon={<Bell size={21} color={colors.foreground} />}
            />
          </View>
        }
      />

      {waitingAtGate.length > 0 ? (
        <AttentionCard
          Icon={DoorOpen}
          tone="danger"
          title={
            waitingAtGate.length === 1
              ? `${waitingAtGate[0].visitorName} is at the gate`
              : `${waitingAtGate.length} visitors are at the gate`
          }
          detail="Let them in or refuse before the request runs out"
          accessibilityLabel="A visitor is waiting at the gate. Open visitor passes to answer."
          onPress={() => router.push('/(app)/visitor-passes')}
        />
      ) : null}

      <QueryState
        query={dues}
        skeleton={<Skeleton height={180} radius={radius.lg} />}
        errorTitle="We couldn't load your dues"
        errorDescription="Check your connection and try again before making a payment."
      >
        <Card elevated padding={spacing['2xl']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
              }}
            >
              <ReceiptText size={16} color={colors.primary} />
            </View>
            <Text variant="label" color="mutedForeground" uppercase style={{ flex: 1 }}>
              Outstanding dues
            </Text>
            <BalanceVisibilityButton visible={showMoney} onToggle={toggleMoney} />
          </View>
          <Text variant="display" style={{ marginTop: spacing.md }}>
            {showMoney ? formatNaira(outstanding) : '••••••'}
          </Text>
          <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.xxs }}>
            {outstanding > 0 ? 'Unpaid charges on your household' : 'Nothing to pay right now'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginTop: spacing.xl,
            }}
          >
            {outstanding > 0 ? (
              <Button
                label="Pay dues"
                size="sm"
                fullWidth={false}
                onPress={() => router.push('/(app)/dues')}
              />
            ) : null}
            <Button
              label="View dues"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => router.push('/(app)/dues')}
            />
          </View>
        </Card>
      </QueryState>

      <PressableScale
        onPress={() => router.push('/(app)/visitor-passes')}
        accessibilityRole="button"
        accessibilityLabel={
          passes.data
            ? `Visitor passes, ${activePasses.length} active, ${insideNow} inside now`
            : 'Visitor passes'
        }
      >
        <Card elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
              }}
            >
              <KeyRound size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">Visitor passes</Text>
              {passes.isPending ? (
                <Skeleton height={12} width="60%" />
              ) : (
                <Text variant="caption" color="mutedForeground">
                  {passes.data
                    ? activePasses.length === 0
                      ? 'No active passes. Issue one before a guest arrives.'
                      : `${activePasses.length} active${insideNow > 0 ? ` · ${insideNow} inside now` : ''}`
                    : 'Invite guests and answer the gate'}
                </Text>
              )}
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </View>
        </Card>
      </PressableScale>

      <Card elevated>
        <SectionHeader
          title="Recent announcements"
          description="Updates from your estate team"
          actionLabel="View all"
          onAction={() => router.push('/(app)/(resident)/announcements')}
        />
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          <QueryState
            query={announcements}
            skeleton={
              <View style={{ gap: spacing.md }}>
                <Skeleton height={14} width="90%" />
                <Skeleton height={14} width="70%" />
              </View>
            }
            errorTitle="Announcements are unavailable"
            errorDescription="Try again to load the latest updates from your estate team."
            isEmpty={!recent.length}
            empty={{
              icon: <Megaphone size={28} color={colors.mutedForeground} />,
              title: "You're up to date",
              description: 'New community announcements will appear here.',
            }}
          >
            {recent.map((a, i) => (
              <View key={a.id}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                  <View
                    style={{
                      width: 3,
                      alignSelf: 'stretch',
                      borderRadius: radius.full,
                      backgroundColor: a.priority === 'urgent' ? colors.destructive : colors.border,
                    }}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {a.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                      {a.body}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {relativeTime(a.createdAt)}
                    </Text>
                  </View>
                  {a.priority === 'urgent' ? <Badge label="Urgent" tone="danger" /> : null}
                </View>
                {i < recent.length - 1 ? <Divider style={{ marginTop: spacing.md }} /> : null}
              </View>
            ))}
          </QueryState>
        </View>
      </Card>

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Community services"
          description="Fast access to everyday estate tools"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <PressableScale
              key={href}
              onPress={() => router.push(href)}
              haptic={false}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={{
                width: '31%',
                minHeight: 104,
                paddingHorizontal: spacing.xs,
                paddingVertical: spacing.md,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                }}
              >
                <Icon size={19} color={colors.primary} />
              </View>
              <Text variant="caption" style={{ fontWeight: '600' }} center numberOfLines={2}>
                {label}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>
    </Screen>
  );
}
