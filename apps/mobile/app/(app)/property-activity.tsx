import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { History } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ListSkeleton,
  QueryState,
  SegmentedControl,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  ACTOR_KIND_LABEL,
  ACTOR_KIND_TONE,
  managementApi,
  type ActivityItem,
  type ActivityWho,
} from '@/lib/api/management';
import { formatDate, formatTime } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const WHO_OPTIONS: { value: ActivityWho; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'managers', label: 'Managers only' },
];

/**
 * What managers, Sureground, tenants and automatic jobs have done on the
 * caller's properties, newest first. The caller's own actions are left out.
 * Shared by the landlord and owner portals (the web's PropertyActivityLog).
 */
export default function PropertyActivity() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [propertyId, setPropertyId] = useState('');
  const [who, setWho] = useState<ActivityWho>('everyone');

  const feed = useInfiniteQuery({
    queryKey: qk.management.activity(propertyId, who),
    queryFn: ({ pageParam }) =>
      managementApi.activity({ propertyId: propertyId || undefined, who, before: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextBefore,
    placeholderData: keepPreviousData,
  });

  const properties = feed.data?.pages[0]?.properties ?? [];
  const sections = useMemo(() => {
    const days = new Map<string, ActivityItem[]>();
    for (const item of feed.data?.pages.flatMap((p) => p.items) ?? []) {
      const day = formatDate(item.at);
      days.set(day, [...(days.get(day) ?? []), item]);
    }
    return [...days.entries()].map(([title, data]) => ({ title, data }));
  }, [feed.data]);

  const filters = (
    <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
      <SegmentedControl
        options={WHO_OPTIONS}
        value={who}
        onChange={setWho}
        accessibilityLabel="Whose actions"
      />
      {properties.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Chip label="All properties" selected={!propertyId} onPress={() => setPropertyId('')} />
          {properties.map((p) => (
            <Chip
              key={p.id}
              label={p.title}
              selected={propertyId === p.id}
              onPress={() => setPropertyId(p.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Oversight"
        title="Activity log"
        subtitle="What others have done on your properties"
        onBack={() => goBack()}
      />

      <QueryState
        query={feed}
        skeleton={<ListSkeleton rows={5} />}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={filters}
          renderSectionHeader={({ section }) => (
            <Text
              variant="callout"
              accessibilityRole="header"
              style={{ fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm }}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => <ActivityRow item={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={feed.isRefetching && !feed.isFetchingNextPage}
              onRefresh={() => feed.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          // The filters live in the header, so an empty result stays inside the list.
          ListEmptyComponent={
            <EmptyState
              icon={<History size={32} color={colors.mutedForeground} />}
              title="Nothing yet"
              description="When someone acts on your properties, it shows up here."
            />
          }
          ListFooterComponent={
            feed.hasNextPage ? (
              <Button
                label="Show older activity"
                variant="outline"
                loading={feed.isFetchingNextPage}
                onPress={() => feed.fetchNextPage()}
                style={{ marginTop: spacing.md }}
              />
            ) : null
          }
        />
      </QueryState>
    </View>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const { spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="body">
            <Text variant="bodyStrong">{item.actor}</Text> · {item.label}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {item.propertyTitle} · {formatTime(item.at)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Badge label={ACTOR_KIND_LABEL[item.actorKind]} tone={ACTOR_KIND_TONE[item.actorKind]} />
          {item.important ? <Badge label="Important" tone="warning" /> : null}
        </View>
      </View>
    </Card>
  );
}
