import { Pressable, RefreshControl, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { savedSearchesApi, type SavedSearch } from '@/lib/api/savedSearches';
import { PROPERTY_TYPE_LABEL } from '@/lib/api/properties';
import { ApiError } from '@/lib/api/client';

function filterSummary(s: SavedSearch): string {
  const parts: string[] = [];
  if (s.filters.location) parts.push(s.filters.location);
  if (s.filters.bedrooms) parts.push(`${s.filters.bedrooms}+ bed`);
  if (s.filters.maxPrice) parts.push(`up to ₦${s.filters.maxPrice.toLocaleString()}`);
  if (s.filters.propertyType) parts.push(PROPERTY_TYPE_LABEL[s.filters.propertyType]);
  if (s.filters.verifiedOnly) parts.push('Verified only');
  return parts.length ? parts.join(' · ') : 'Any home';
}

export default function SavedSearches() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: qk.renter.savedSearches, queryFn: savedSearchesApi.list });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => savedSearchesApi.toggleAlerts(id),
    onSuccess: (updated) => {
      qc.setQueryData<SavedSearch[]>(qk.renter.savedSearches, (old) =>
        old?.map((s) => (s.id === updated.id ? updated : s))
      );
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update alerts.', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => savedSearchesApi.remove(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<SavedSearch[]>(qk.renter.savedSearches, (old) =>
        old?.filter((s) => s.id !== id)
      );
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not delete this search.', 'error'),
  });

  const runSearch = (s: SavedSearch) => {
    router.push({
      pathname: '/(app)/(renter)/discover',
      params: { filters: JSON.stringify(s.filters) },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Saved searches</Text>
      </View>

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} radius={radius.lg} />
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState
          icon={<Bookmark size={34} color={colors.mutedForeground} />}
          title="No saved searches yet"
          description="Apply filters on Discover, then tap Save search to get alerted to new matches."
        />
      ) : (
        <FlashList
          data={query.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <Pressable
                  onPress={() => runSearch(item)}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text variant="bodyStrong">{item.name}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {filterSummary(item)}
                    </Text>
                    {item.newMatches > 0 ? (
                      <Text
                        variant="caption"
                        color="primary"
                        style={{ fontWeight: '600', marginTop: 2 }}
                      >
                        {item.newMatches} {item.newMatches === 1 ? 'match' : 'matches'}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Pressable>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: spacing.md,
                    paddingTop: spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="caption" color="mutedForeground">
                      Alerts
                    </Text>
                    <Switch
                      value={item.alertsEnabled}
                      onValueChange={() => toggleMutation.mutate(item.id)}
                      trackColor={{ true: colors.primary, false: colors.secondary }}
                      thumbColor={colors.card}
                    />
                  </View>
                  <Pressable onPress={() => removeMutation.mutate(item.id)} hitSlop={8}>
                    <Trash2 size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              </Card>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
