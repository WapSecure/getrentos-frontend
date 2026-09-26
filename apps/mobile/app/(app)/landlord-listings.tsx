import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Pause, Play, ShieldAlert, Tag, Video, Plus } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { CreateListingSheet } from '@/components/landlord/CreateListingSheet';
import {
  landlordApi,
  LISTING_STATUS_LABEL,
  LISTING_STATUS_TONE,
  type LandlordListing,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function LandlordListings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [gateBlocked, setGateBlocked] = useState(false);

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
    onError: (e) => {
      // Republishing runs the listing trust gate, which refuses until the
      // landlord's identity is approved. That is a real requirement, not a
      // failure, so say what to do rather than "something went wrong".
      if (e instanceof ApiError && e.code === 'IDENTITY_REQUIRED') {
        setGateBlocked(true);
        toast.show('Verify your identity to put a listing back online.', 'error');
        return;
      }
      toast.show(e instanceof ApiError ? e.message : 'Could not update that listing.', 'error');
    },
  });

  const items = query.data ?? [];
  const live = items.filter((l) => l.status === 'published').length;

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
          eyebrow="Marketplace"
          title="Listings"
          subtitle={query.data ? `${live} live of ${items.length}` : 'Publish and manage vacancies'}
          onBack={() => router.back()}
          accessory={
            <IconButton
              onPress={() => setCreating(true)}
              accessibilityLabel="List a unit"
              icon={<Plus size={20} color={colors.primary} />}
            />
          }
        />
      </View>

      {gateBlocked ? (
        <Pressable
          onPress={() => router.push('/(app)/verify-identity')}
          accessibilityRole="button"
          accessibilityLabel="Verify your identity to publish listings"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginHorizontal: spacing.xl,
            marginBottom: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.warning + '1f',
          }}
        >
          <ShieldAlert size={16} color={colors.warning} />
          <Text variant="caption" style={{ flex: 1, color: colors.warning }}>
            Verify your identity to publish listings
          </Text>
        </Pressable>
      ) : null}

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

      <CreateListingSheet open={creating} onClose={() => setCreating(false)} />
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
            <Badge
              label={LISTING_STATUS_LABEL[l.status] ?? l.status}
              tone={LISTING_STATUS_TONE[l.status] ?? 'neutral'}
            />
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
