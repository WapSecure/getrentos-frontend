import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark, ChevronRight, Trash2 } from 'lucide-react-native';
import {
  Card,
  IconButton,
  QueryState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { savedSearchesApi, type SavedSearch } from '@/lib/api/savedSearches';
import { PROPERTY_TYPE_LABEL } from '@/lib/api/properties';
import { ApiError } from '@/lib/api/client';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

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

  // Alerts flip at once and go back if the server refuses.
  const toggleMutation = useOptimisticMutation({
    mutationFn: (id: string) => savedSearchesApi.toggleAlerts(id),
    patches: (id) => [
      {
        queryKey: qk.renter.savedSearches,
        update: (old) =>
          (old as SavedSearch[]).map((s) =>
            s.id === id ? { ...s, alertsEnabled: !s.alertsEnabled } : s
          ),
      },
    ],
    errorMessage: 'Could not update alerts.',
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
      <DetailScreenHeader
        eyebrow="Property discovery"
        title="Saved searches"
        subtitle="Alerts and reusable property filters"
        onBack={() => goBack()}
      />

      <View style={{ flex: 1 }}>
        <QueryState
          query={query}
          skeleton={
            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={90} radius={radius.lg} />
              ))}
            </View>
          }
          isEmpty={!query.data?.length}
          empty={{
            icon: <Bookmark size={34} color={colors.mutedForeground} />,
            title: 'No saved searches yet',
            description:
              'Apply filters on Discover, then tap Save search to get alerted to new matches.',
          }}
        >
          <FlashList
            data={query.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <Card elevated>
                  <Pressable
                    onPress={() => runSearch(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}, ${filterSummary(item)}`}
                    accessibilityHint="Runs this search"
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
                    <SwitchRow
                      label="Alerts"
                      value={item.alertsEnabled}
                      onValueChange={() => toggleMutation.mutate(item.id)}
                      style={{ flex: 1 }}
                    />
                    <IconButton
                      accessibilityLabel={`Delete ${item.name}`}
                      icon={<Trash2 size={16} color={colors.destructive} />}
                      onPress={() => removeMutation.mutate(item.id)}
                    />
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
        </QueryState>
      </View>
    </View>
  );
}
