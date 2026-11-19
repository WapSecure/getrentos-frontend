import { Pressable, View } from 'react-native';
import { Megaphone, Square, Volume2 } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  ListSkeleton,
  QueryState,
  Screen,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { residentApi } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { usePagedList } from '@/lib/query/usePagedList';
import { relativeTime } from '@/lib/format';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useReadAloud } from '@/lib/voice';

export default function ResidentAnnouncements() {
  const { colors, spacing } = useTheme();
  const readAloud = useReadAloud();
  const list = usePagedList(qk.resident.announcementsPaged, (page) =>
    residentApi.listAnnouncements(page, 10)
  );
  const query = list.query;

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <DashboardHeader
        eyebrow="Your community"
        title="Announcements"
        subtitle="Official updates from your estate team"
      />

      <QueryState
        query={query}
        skeleton={<ListSkeleton variant="card" rows={3} height={84} />}
        isEmpty={list.items.length === 0}
        empty={{
          icon: <Megaphone size={34} color={colors.mutedForeground} />,
          title: 'No announcements yet',
          description: "Your estate manager's updates will show up here.",
        }}
      >
        {list.items.map((a, i) => (
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
              <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                {a.priority === 'urgent' ? <Badge label="Urgent" tone="danger" /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    readAloud.speaking === i ? 'Stop reading' : `Listen to ${a.title}`
                  }
                  onPress={() => readAloud.toggle(i, `${a.title}. ${a.body}`, 'en')}
                  hitSlop={8}
                >
                  {readAloud.speaking === i ? (
                    <Square size={18} color={colors.primary} />
                  ) : (
                    <Volume2 size={18} color={colors.primary} />
                  )}
                </Pressable>
              </View>
            </View>
          </Card>
        ))}
        {list.hasMore ? (
          <Button
            label="Show more"
            variant="ghost"
            loading={list.isLoadingMore}
            onPress={list.loadMore}
          />
        ) : null}
      </QueryState>
    </Screen>
  );
}
