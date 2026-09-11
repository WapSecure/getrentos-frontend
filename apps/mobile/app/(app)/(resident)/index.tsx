import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Contact, Landmark, Megaphone, Package, TriangleAlert, Vote } from 'lucide-react-native';
import { Badge, Card, Divider, Screen, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { relativeTime, firstName } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';

const QUICK_LINKS = [
  { href: '/(app)/violations', label: 'Violations', icon: TriangleAlert },
  { href: '/(app)/deliveries', label: 'Deliveries', icon: Package },
  { href: '/(app)/directory', label: 'Directory', icon: Contact },
  { href: '/(app)/polls', label: 'Polls', icon: Vote },
  { href: '/(app)/committee', label: 'Committee', icon: Landmark },
] as const;

export default function ResidentHome() {
  const { colors, spacing, radius } = useTheme();
  const { profile } = useAuth();

  const household = useQuery({
    queryKey: qk.resident.household,
    queryFn: () => residentApi.getMyHousehold(),
  });
  const announcements = useQuery({
    queryKey: qk.resident.announcements(1, 3),
    queryFn: () => residentApi.listAnnouncements(1, 3),
  });

  const isRefreshing = household.isRefetching || announcements.isRefetching;
  const onRefresh = () => {
    household.refetch();
    announcements.refetch();
  };

  return (
    <Screen refreshing={isRefreshing} onRefresh={onRefresh}>
      <View style={{ gap: 2 }}>
        <Text variant="title">Hi, {firstName(profile?.legalName)}</Text>
        {household.data ? (
          <Text variant="callout" color="mutedForeground">
            {household.data.estate.name} · Unit {household.data.unitLabel}
          </Text>
        ) : household.isLoading ? (
          <Skeleton height={16} width="60%" />
        ) : null}
      </View>

      <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Megaphone size={18} color={colors.primary} />
          <Text variant="bodyStrong">Recent announcements</Text>
        </View>
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {announcements.isLoading ? (
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
            <Text variant="caption" color="mutedForeground">
              No announcements yet.
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => router.push('/(app)/(resident)/announcements')}
          style={{ marginTop: spacing.md }}
        >
          <Text variant="callout" style={{ color: colors.primary, fontWeight: '600' }}>
            View all
          </Text>
        </Pressable>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Community</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Pressable
              key={href}
              onPress={() => router.push(href)}
              style={{
                width: '31%',
                aspectRatio: 1,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
            >
              <Icon size={22} color={colors.primary} />
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
