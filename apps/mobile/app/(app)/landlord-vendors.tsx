import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HardHat, Phone, Plus, Trash2 } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordVendor } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { AddVendorSheet } from '@/components/landlord/AddVendorSheet';
import { StarRating } from '@/components/reviews/StarRating';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function LandlordVendors() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const query = useQuery({
    queryKey: qk.landlord.vendors(),
    queryFn: () => landlordApi.vendors(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => landlordApi.deleteVendor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'vendors'] });
      toast.show('Vendor removed.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not remove that vendor.', 'error'),
  });

  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Operations"
        title="Vendors"
        subtitle={
          query.data ? `${query.data.total} on your list` : 'Your trusted service providers'
        }
        onBack={() => router.back()}
        accessory={
          <IconButton
            onPress={() => setAdding(true)}
            accessibilityLabel="Add a vendor"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(v) => v.id}
          renderItem={({ item }: { item: LandlordVendor }) => (
            <VendorRow
              vendor={item}
              onCall={() => Linking.openURL(`tel:${item.phone}`)}
              onRemove={() =>
                Alert.alert('Remove vendor?', `${item.name} will come off your list.`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => remove.mutate(item.id),
                  },
                ])
              }
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={84} radius={radius.lg} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<HardHat size={32} color={colors.mutedForeground} />}
                title="No vendors yet"
                description="Add the tradespeople you use so you can assign them to maintenance requests."
              />
            )
          }
        />
      )}

      <AddVendorSheet open={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function VendorRow({
  vendor: v,
  onCall,
  onRemove,
}: {
  vendor: LandlordVendor;
  onCall: () => void;
  onRemove: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {v.name}
            </Text>
            <Badge label={v.serviceType} tone="neutral" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {v.rating > 0 ? <StarRating value={Math.round(v.rating)} size={12} /> : null}
            <Text variant="caption" color="mutedForeground">
              {v.jobsCompleted} job{v.jobsCompleted === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onCall}
          accessibilityRole="button"
          accessibilityLabel={`Call ${v.name}`}
          hitSlop={8}
        >
          <Phone size={17} color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${v.name}`}
          hitSlop={8}
        >
          <Trash2 size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Card>
  );
}
