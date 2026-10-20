import { Alert, RefreshControl, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  QueryState,
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
import { formatDate, formatTime } from '@/lib/format';
import { VideoCallAction } from '@/components/viewings/VideoCallAction';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

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
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Buyer journey"
          title="Viewings"
          subtitle={
            query.data
              ? `${items.length} scheduled request${items.length === 1 ? '' : 's'}`
              : 'Your property tour schedule'
          }
          onBack={() => goBack()}
        />
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height={100} radius={radius.lg} />
            ))}
          </View>
        }
        isEmpty={items.length === 0}
        empty={{
          icon: <Calendar size={34} color={colors.mutedForeground} />,
          title: 'No viewings requested',
          description: 'Request a viewing from a listing to see it here.',
        }}
      >
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
                      {item.scheduledAt
                        ? `${formatDate(item.scheduledAt, 'medium')} · ${formatTime(item.scheduledAt)}`
                        : `${formatDate(item.requestedDate, 'medium')} · ${item.requestedTime}`}
                    </Text>
                    {item.mode === 'video' ? (
                      <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                        Live video viewing
                      </Text>
                    ) : null}
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
                <View style={{ marginTop: spacing.sm }}>
                  <VideoCallAction
                    viewing={item}
                    join={() => buyerViewingsApi.joinVideoCall(item.id)}
                  />
                </View>
                {item.status === 'pending' || item.status === 'confirmed' ? (
                  <Button
                    label="Cancel viewing"
                    variant="outline"
                    size="sm"
                    style={{ marginTop: spacing.md }}
                    loading={cancelMutation.isPending && cancelMutation.variables === item.id}
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
      </QueryState>
    </View>
  );
}
