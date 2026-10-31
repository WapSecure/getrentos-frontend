import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarCheck,
  Contact,
  DoorOpen,
  KeyRound,
  Landmark,
  Megaphone,
  Package,
  ReceiptText,
  TriangleAlert,
  Vote,
  Wrench,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
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
  { href: '/(app)/visitor-passes', label: 'Visitor Passes', icon: KeyRound },
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
  // A walk-in has a ten-minute window, so the home screen keeps asking while one
  // is open: the resident must not have to think to go looking for it.
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

  const outstanding = (dues.data?.items ?? [])
    .filter((d) => d.status === 'pending' || d.status === 'overdue' || d.status === 'processing')
    // `amount` already includes any late fee.
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Screen refreshing={isRefreshing} onRefresh={onRefresh}>
      {/* First, above even the greeting: if the estate is calling the roll,
          nothing else on this screen matters as much. Renders nothing when there
          is no emergency, which is almost always. */}
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
          <IconButton
            onPress={() => router.push('/(app)/notifications')}
            // IconButton already appends ", N unread" from the badge, so the
            // label must not repeat the count (DEF-243).
            accessibilityLabel="Notifications"
            badge={unreadCount}
            icon={<Bell size={21} color={colors.foreground} />}
          />
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

      {dues.isError && !dues.data ? (
        <Card elevated>
          <ErrorState
            title="We couldn't load your dues"
            description="Check your connection and try again before making a payment."
            onRetry={() => dues.refetch()}
          />
        </Card>
      ) : dues.isLoading ? (
        <Skeleton height={90} radius={16} />
      ) : (
        <Card elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <ReceiptText size={18} color={colors.primary} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              Outstanding dues
            </Text>
            <BalanceVisibilityButton visible={showMoney} onToggle={toggleMoney} />
          </View>
          <Text variant="title" style={{ marginTop: spacing.sm }}>
            {showMoney ? formatNaira(outstanding) : '••••••'}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
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
      )}

      <Card elevated>
        <SectionHeader
          title="Recent announcements"
          description="Updates from your estate team"
          actionLabel="View all"
          onAction={() => router.push('/(app)/(resident)/announcements')}
        />
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {announcements.isError && !announcements.data ? (
            <ErrorState
              title="Announcements are unavailable"
              description="Try again to load the latest updates from your estate team."
              onRetry={() => announcements.refetch()}
            />
          ) : announcements.isLoading ? (
            <>
              <Skeleton height={14} width="90%" />
              <Skeleton height={14} width="70%" />
            </>
          ) : announcements.data && announcements.data.items.length > 0 ? (
            announcements.data.items.map((a, i) => (
              <View key={a.id}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
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
                {i < announcements.data.items.length - 1 ? (
                  <Divider style={{ marginTop: spacing.md }} />
                ) : null}
              </View>
            ))
          ) : (
            <EmptyState
              icon={<Megaphone size={28} color={colors.mutedForeground} />}
              title="You're up to date"
              description="New community announcements will appear here."
            />
          )}
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <SectionHeader
          title="Community services"
          description="Fast access to everyday estate tools"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Pressable
              key={href}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={({ pressed }) => ({
                width: '31%',
                minHeight: 104,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.accent : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
              })}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                }}
              >
                <Icon size={19} color={colors.primary} />
              </View>
              <Text variant="caption" style={{ fontWeight: '600' }} center>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
