import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Megaphone, Plus } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { AnnouncementSheet, errorText } from '@/components/estate/EstateUI';
import { StatusPill } from '@/components/host/HostUI';
import { useEstate } from '@/hooks/useEstate';
import { estateManagerApi, type Announcement } from '@/lib/api/estateManager';
import { formatDate, relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

/** Everything the office has told residents, newest first, with edit and delete. */
export default function EstateAnnouncements() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const query = useInfiniteQuery({
    queryKey: [...qk.estateManager.announcements(estateId), 'all'],
    queryFn: ({ pageParam }) => estateManagerApi.announcements(estateId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<Announcement[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );

  const remove = useMutation({
    mutationFn: (a: Announcement) => estateManagerApi.removeAnnouncement(estateId, a.id),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.announcements(estateId) });
      toast.show('Announcement deleted.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not delete it.'), 'error'),
  });

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Estate'}
          title="Announcements"
          subtitle="What your residents have been told"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="New announcement"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setComposing(true)}
            />
          }
        />
      </View>

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={130} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(a) => a.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: Announcement }) => {
            const urgent = item.priority === 'urgent';
            const edited = item.updatedAt !== item.createdAt;
            return (
              <Card
                elevated
                style={{
                  gap: spacing.sm,
                  borderLeftWidth: urgent ? 3 : 0,
                  borderLeftColor: colors.destructive,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {item.title}
                  </Text>
                  {urgent ? <StatusPill label="Urgent" tone="danger" /> : null}
                </View>
                <Text variant="callout">{item.body}</Text>
                <Text variant="caption" color="mutedForeground">
                  {formatDate(item.createdAt, 'medium')} · {relativeTime(item.createdAt)}
                  {edited ? ' · edited' : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Edit"
                    size="sm"
                    variant="secondary"
                    style={{ flex: 1 }}
                    accessibilityLabel={`Edit ${item.title}`}
                    onPress={() => setEditing(item)}
                  />
                  <Button
                    label="Delete"
                    size="sm"
                    variant="ghost"
                    style={{ flex: 1 }}
                    accessibilityLabel={`Delete ${item.title}`}
                    loading={remove.isPending && remove.variables?.id === item.id}
                    onPress={() =>
                      Alert.alert(
                        'Delete this announcement?',
                        'Residents stop seeing it. Texts already sent can’t be recalled.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => remove.mutate(item),
                          },
                        ]
                      )
                    }
                  />
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<Megaphone size={34} color={colors.mutedForeground} />}
              title="No announcements yet"
              description="Tell every household at once: a water outage, a meeting, a new rule."
              action={<Button label="Post an announcement" onPress={() => setComposing(true)} />}
            />
          }
        />
      )}

      <AnnouncementSheet
        open={composing}
        onClose={() => setComposing(false)}
        estateId={estateId}
        households={estate?.householdCount}
      />
      <AnnouncementSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        estateId={estateId}
        announcement={editing ?? undefined}
      />
    </View>
  );
}
