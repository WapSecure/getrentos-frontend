import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react-native';
import {
  Badge,
  Card,
  ListSkeleton,
  QueryState,
  Screen,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { relativeTime } from '@/lib/format';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function ResidentAnnouncements() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.resident.announcements(1, 50),
    queryFn: () => residentApi.listAnnouncements(1, 50),
  });

  return (
    <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
      <DashboardHeader
        eyebrow="Your community"
        title="Announcements"
        subtitle="Official updates from your estate team"
      />

      <QueryState
        query={query}
        skeleton={<ListSkeleton variant="card" rows={3} height={84} />}
        isEmpty={!query.data?.items.length}
        empty={{
          icon: <Megaphone size={34} color={colors.mutedForeground} />,
          title: 'No announcements yet',
          description: "Your estate manager's updates will show up here.",
        }}
      >
        {query.data?.items.map((a) => (
          <Card key={a.id} elevated>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="bodyStrong">{a.title}</Text>
                <Text variant="body" color="mutedForeground">
                  {a.body}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {relativeTime(a.createdAt)}
                </Text>
              </View>
              {a.priority === 'urgent' ? <Badge label="Urgent" tone="danger" /> : null}
            </View>
          </Card>
        ))}
      </QueryState>
    </Screen>
  );
}
