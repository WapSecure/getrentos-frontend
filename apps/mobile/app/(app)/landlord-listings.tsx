import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Pause, Play, Tag, Video } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, LISTING_STATUS_TONE, type LandlordListing } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

export default function LandlordListings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.listings,
    queryFn: landlordApi.listings,
  });

  const togglePause = useMutation({
    mutationFn: (id: string) => landlordApi.toggleListingPause(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: qk.landlord.listings });
      toast.show(
        updated.status === 'paused' ? 'Listing paused.' : 'Listing live again.',
        'success'
      );
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not update that listing.', 'error'),
  });

  const items = query.data ?? [];
  const live = items.filter((l) => l.status === 'published').length;

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
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title">Listings</Text>
          {query.data ? (
            <Text variant="caption" color="mutedForeground">
              {live} live of {items.length}
            </Text>
          ) : null}
        </View>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={116} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(l) => l.id}
          renderItem={({ item }: { item: LandlordListing }) => (
            <ListingRow
              listing={item}
              busy={busyId === item.id}
              onTogglePause={() => togglePause.mutate(item.id)}
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
            <EmptyState
              icon={<Tag size={32} color={colors.mutedForeground} />}
              title="No listings yet"
              description="Publish a vacant unit to start receiving enquiries."
            />
          }
        />
      )}
    </View>
  );
}

function ListingRow({
  listing: l,
  busy,
  onTogglePause,
}: {
  listing: LandlordListing;
  busy: boolean;
  onTogglePause: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const paused = l.status === 'paused';
  const canPause = l.status === 'published' || paused;

  return (
    <Card padding="none" style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: radius.md,
            overflow: 'hidden',
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {l.coverImage ? (
            <Image
              source={{ uri: l.coverImage }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Tag size={20} color={colors.mutedForeground} />
          )}
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {l.listingTitle}
            </Text>
            <Badge label={l.status} tone={LISTING_STATUS_TONE[l.status]} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Price amount={l.askingRent} period={l.rentPeriod} variant="caption" compact />
            {l.videoTourUrl ? <Video size={12} color={colors.mutedForeground} /> : null}
            {l.shortLetEnabled ? <Badge label="Shortlet" tone="info" /> : null}
          </View>

          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            Available {formatDate(l.availabilityDate, 'short')}
          </Text>

          {canPause ? (
            <Pressable
              onPress={onTogglePause}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={
                paused ? `Republish ${l.listingTitle}` : `Pause ${l.listingTitle}`
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
                opacity: busy ? 0.5 : 1,
              }}
            >
              {paused ? (
                <Play size={13} color={colors.primary} />
              ) : (
                <Pause size={13} color={colors.mutedForeground} />
              )}
              <Text
                variant="caption"
                style={{
                  fontWeight: '600',
                  color: paused ? colors.primary : colors.mutedForeground,
                }}
              >
                {paused ? 'Make live again' : 'Pause listing'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
