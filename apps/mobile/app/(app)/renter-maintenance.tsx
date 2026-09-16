import { useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, Ban, ChevronLeft, Plus, Star, Wrench } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  maintenanceApi,
  MAINTENANCE_CATEGORY_LABEL,
  MAINTENANCE_STATUS_LABEL,
  MAINTENANCE_STATUS_TONE,
  type MaintenanceRequest,
} from '@/lib/api/maintenance';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

export default function Maintenance() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [ratingFor, setRatingFor] = useState<MaintenanceRequest | null>(null);

  const query = useQuery({
    queryKey: qk.renter.maintenance,
    queryFn: () => maintenanceApi.list(1, 30),
  });
  const items = query.data?.items ?? [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.maintenance }),
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not cancel this request.', 'error'),
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      maintenanceApi.rateVendor(id, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.maintenance });
      setRatingFor(null);
      toast.show('Thanks for the feedback.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not submit your rating.', 'error'),
  });

  const confirmCancel = (id: string) => {
    Alert.alert(
      'Cancel this request?',
      'Your landlord will be notified that this is no longer needed.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Cancel request', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
      ]
    );
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
        <Text variant="title" style={{ flex: 1 }}>
          Maintenance
        </Text>
        <Pressable
          onPress={() => router.push('/(app)/report-maintenance')}
          accessibilityRole="button"
          accessibilityLabel="Report an issue"
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={110} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Wrench size={34} color={colors.mutedForeground} />}
          title="No maintenance requests"
          description="Report an issue and your landlord will be notified right away."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: MaintenanceRequest }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {item.isEmergency ? (
                        <AlertTriangle size={13} color={colors.destructive} />
                      ) : null}
                      <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                        {item.title}
                      </Text>
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {MAINTENANCE_CATEGORY_LABEL[item.category]} ·{' '}
                      {formatDate(item.createdAt, 'short')}
                    </Text>
                  </View>
                  <Badge
                    label={MAINTENANCE_STATUS_LABEL[item.status]}
                    tone={MAINTENANCE_STATUS_TONE[item.status]}
                  />
                </View>

                {item.assignedVendorName ? (
                  <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                    Vendor: {item.assignedVendorName}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                  {item.status === 'submitted' || item.status === 'assigned' ? (
                    <Pressable
                      onPress={() => confirmCancel(item.id)}
                      hitSlop={8}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    >
                      <Ban size={13} color={colors.mutedForeground} />
                      <Text variant="caption" color="mutedForeground">
                        Cancel
                      </Text>
                    </Pressable>
                  ) : null}
                  {item.status === 'resolved' && !item.vendorRating ? (
                    <Pressable
                      onPress={() => setRatingFor(item)}
                      hitSlop={8}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    >
                      <Star size={13} color={colors.primary} />
                      <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                        Rate vendor
                      </Text>
                    </Pressable>
                  ) : null}
                  {item.vendorRating ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Star size={13} color={colors.warning} fill={colors.warning} />
                      <Text variant="caption" color="mutedForeground">
                        You rated {item.vendorRating}/5
                      </Text>
                    </View>
                  ) : null}
                </View>

                {ratingFor?.id === item.id ? (
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Pressable
                        key={n}
                        onPress={() => rateMutation.mutate({ id: item.id, rating: n })}
                        hitSlop={6}
                      >
                        <Star size={22} color={colors.warning} fill="transparent" />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
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
