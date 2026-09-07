import { useMemo } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Heart, FileText, MessageCircle, CalendarClock, type LucideIcon } from 'lucide-react-native';
import { Card, Screen, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { renterApi, type RenterDashboardStats } from '@/lib/api/renter';
import { useAuth } from '@/lib/auth/AuthProvider';
import { firstName } from '@/lib/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface Metric {
  key: keyof RenterDashboardStats;
  label: string;
  Icon: LucideIcon;
  tint: 'primary' | 'success' | 'warning' | 'purple';
}

const METRICS: Metric[] = [
  { key: 'savedPropertiesCount', label: 'Saved', Icon: Heart, tint: 'primary' },
  { key: 'activeApplicationsCount', label: 'Applications', Icon: FileText, tint: 'success' },
  { key: 'unreadMessagesCount', label: 'Unread', Icon: MessageCircle, tint: 'warning' },
  { key: 'upcomingViewingsCount', label: 'Viewings', Icon: CalendarClock, tint: 'purple' },
];

export default function RenterHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();

  const stats = useQuery({
    queryKey: qk.renter.dashboardStats,
    queryFn: renterApi.dashboardStats,
  });

  const tintColor = useMemo(
    () => ({
      primary: colors.primary,
      success: colors.success,
      warning: colors.warning,
      purple: colors.purple,
    }),
    [colors],
  );

  return (
    <Screen refreshing={stats.isRefetching} onRefresh={() => stats.refetch()}>
      <View style={{ gap: spacing.xxs }}>
        <Text variant="label" color="primary" uppercase>
          {greeting()}
        </Text>
        <Text variant="title">{firstName(profile?.legalName)} 👋</Text>
        <Text variant="body" color="mutedForeground">
          Here’s what’s happening with your search.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {METRICS.map(({ key, label, Icon, tint }) => (
          <Card
            key={key}
            elevated
            style={{ flexBasis: '47%', flexGrow: 1, gap: spacing.sm }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
              }}
            >
              <Icon size={18} color={tintColor[tint]} />
            </View>
            {stats.isPending ? (
              <Skeleton height={28} width="40%" />
            ) : (
              <Text variant="display" style={{ fontSize: 26, lineHeight: 30 }}>
                {stats.data?.[key] ?? 0}
              </Text>
            )}
            <Text variant="caption" color="mutedForeground">
              {label}
            </Text>
          </Card>
        ))}
      </View>

      {stats.isError ? (
        <Card elevated>
          <Text variant="bodyStrong">Couldn’t load your dashboard</Text>
          <Text variant="callout" color="mutedForeground" style={{ marginTop: 4 }}>
            Pull down to try again.
          </Text>
        </Card>
      ) : null}

      <Card elevated style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">More coming to mobile</Text>
        <Text variant="callout" color="mutedForeground">
          Applications, lease, payments, messages and recommendations are next. The foundation —
          secure auth with refresh, offline-first data, theming — is in place.
        </Text>
      </Card>
    </Screen>
  );
}
