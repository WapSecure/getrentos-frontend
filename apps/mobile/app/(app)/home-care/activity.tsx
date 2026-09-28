import { useMemo } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { History } from 'lucide-react-native';
import { EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { homeCareApi, type TimelineEvent } from '@/lib/api/homeCare';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const dayKey = (iso: string) => iso.slice(0, 10);
const dayLabel = (key: string) => {
  const today = new Date();
  const d = new Date(`${key}T12:00:00`);
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' });
};

/** Everything that happened across the homes, newest first, grouped by day. */
export default function Activity() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: qk.homeCare.timeline,
    queryFn: async () => {
      const res = await homeCareApi.timeline(undefined, 100);
      return Array.isArray(res) ? res : (res?.events ?? []);
    },
  });
  const sections = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const e of [...(query.data ?? [])].sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt)
    )) {
      const k = dayKey(e.occurredAt);
      groups.set(k, [...(groups.get(k) ?? []), e]);
    }
    return [...groups].map(([k, data]) => ({ title: dayLabel(k), data }));
  }, [query.data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader eyebrow="Home care" title="Activity" onBack={() => router.back()} />
      </View>
      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Skeleton height={240} radius={radius.lg} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          renderSectionHeader={({ section }) => (
            <View style={{ paddingVertical: spacing.sm, backgroundColor: colors.background }}>
              <Text variant="label" color="mutedForeground" uppercase accessibilityRole="header">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ alignItems: 'center', width: 12 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginTop: 6,
                    backgroundColor: colors.primary,
                  }}
                />
                {index < section.data.length - 1 ? (
                  <View style={{ flex: 1, width: 2, backgroundColor: colors.border }} />
                ) : null}
              </View>
              <View style={{ flex: 1, paddingBottom: spacing.lg, gap: 2 }}>
                <Text variant="bodyStrong">{item.title}</Text>
                {item.description ? (
                  <Text variant="callout" color="mutedForeground">
                    {item.description}
                  </Text>
                ) : null}
                <Text variant="caption" color="mutedForeground">
                  {new Date(item.occurredAt).toLocaleTimeString('en-NG', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {item.property?.title || item.property?.name
                    ? ` · ${item.property?.title ?? item.property?.name}`
                    : ''}
                  {item.unit?.unitName ? ` · ${item.unit.unitName}` : ''}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<History size={34} color={colors.mutedForeground} />}
              title="Nothing yet"
              description="Work orders, servicing and asset changes show up here."
            />
          }
        />
      )}
    </View>
  );
}
