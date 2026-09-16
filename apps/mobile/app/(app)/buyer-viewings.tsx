import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, ChevronLeft } from 'lucide-react-native';
import {
  Badge,
  Button,
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
  buyerViewingsApi,
  BUYER_VIEWING_STATUS_LABEL,
  BUYER_VIEWING_STATUS_TONE,
  type BuyerViewing,
} from '@/lib/api/buyerViewings';
import { formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api/client';

export default function BuyerViewings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.buyer.viewings(1, 50),
    queryFn: () => buyerViewingsApi.list(1, 50),
  });
  const items = query.data?.items ?? [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => buyerViewingsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyer', 'viewings'] });
      toast.show('Viewing cancelled.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not cancel this viewing.', 'error'),
  });

  const confirmCancel = (item: BuyerViewing) => {
    Alert.alert('Cancel viewing', `Cancel your viewing request for ${item.propertyTitle}?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel viewing',
        style: 'destructive',
        onPress: () => cancelMutation.mutate(item.id),
      },
    ]);
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
        <Text variant="title">Viewings</Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={100} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Calendar size={34} color={colors.mutedForeground} />}
          title="No viewings requested"
          description="Request a viewing from a listing to see it here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: BuyerViewing }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.propertyTitle}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {formatDate(item.requestedDate, 'medium')} · {item.requestedTime}
                    </Text>
                  </View>
                  <Badge
                    label={BUYER_VIEWING_STATUS_LABEL[item.status]}
                    tone={BUYER_VIEWING_STATUS_TONE[item.status]}
                  />
                </View>
                {item.notes ? (
                  <Text variant="callout" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                    {item.notes}
                  </Text>
                ) : null}
                {item.status === 'pending' || item.status === 'confirmed' ? (
                  <Button
                    label="Cancel viewing"
                    variant="outline"
                    size="sm"
                    style={{ marginTop: spacing.md }}
                    loading={cancelMutation.isPending}
                    onPress={() => confirmCancel(item)}
                  />
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
