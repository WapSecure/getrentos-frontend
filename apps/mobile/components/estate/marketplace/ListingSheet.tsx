import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react-native';
import { Button, Price, Text, useTheme, useToast } from '@getrentos/ui-native';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import {
  MAX_LISTING_PHOTOS,
  MOVE_LABEL,
  estateMarketplaceApi,
  listingMoves,
  listingName,
  listingPricePeriod,
  listingStatus,
  listingTypeLabel,
  marketplaceKeys,
  photoRoom,
  statusChangedMessage,
  type EstateListing,
  type ListingStatusChange,
} from '@/lib/api/estateMarketplace';
import { pickPhotos } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { patchListing, reportError } from './MarketplaceUI';

/** Manage one listing: publish, pause or take it down, and its photos. */
export function ListingSheet({
  estateId,
  listing,
  onClose,
}: {
  estateId: string;
  listing: EstateListing | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!listing} onClose={onClose} title={listing ? listingName(listing) : ''}>
      {listing ? <ListingManager estateId={estateId} listing={listing} /> : null}
    </Sheet>
  );
}

function ListingManager({ estateId, listing }: { estateId: string; listing: EstateListing }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const s = listingStatus(listing.status);
  const photos = listing.media ?? [];
  const room = photoRoom(listing);
  const moves = listingMoves(listing.status);

  const settle = (updated: EstateListing) => {
    patchListing(qc, estateId, updated);
    qc.invalidateQueries({ queryKey: marketplaceKeys.all(estateId) });
  };

  const move = useMutation({
    mutationFn: (status: ListingStatusChange) =>
      estateMarketplaceApi.setListingStatus(estateId, listing.id, status),
    onSuccess: (updated) => {
      void haptics.success();
      settle(updated);
      toast.show(statusChangedMessage(updated), 'success');
    },
    onError: (e) => reportError(e, 'Could not change this listing.', toast),
  });

  const addPhotos = useMutation({
    mutationFn: async () => {
      const picked = await pickPhotos(room);
      if (!picked.length) return null;
      return estateMarketplaceApi.addListingPhotos(estateId, listing.id, picked);
    },
    onSuccess: (updated) => {
      if (!updated) return;
      void haptics.success();
      settle(updated);
      toast.show('Photos added.', 'success');
    },
    onError: (e) => reportError(e, 'Could not add those photos.', toast),
  });

  const removePhoto = useMutation({
    mutationFn: (key: string) => estateMarketplaceApi.removeListingPhoto(estateId, listing.id, key),
    onSuccess: (updated) => {
      void haptics.success();
      settle(updated);
      toast.show('Photo removed.', 'success');
    },
    onError: (e) => reportError(e, 'Could not remove that photo.', toast),
  });

  const confirmMove = (to: ListingStatusChange) => {
    if (to !== 'CLOSED') {
      move.mutate(to);
      return;
    }
    Alert.alert(
      'Take this listing down?',
      'It leaves the market and the estate page. To advertise this property again you’ll create a new listing.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Take down', style: 'destructive', onPress: () => move.mutate('CLOSED') },
      ]
    );
  };

  const confirmRemove = (key: string, n: number) =>
    Alert.alert(`Remove photo ${n}?`, 'It comes off this listing straight away.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePhoto.mutate(key) },
    ]);

  const canEditPhotos = listing.status !== 'CLOSED';

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Price
            amount={listing.price}
            period={listingPricePeriod(listing.listingType)}
            variant="heading"
          />
          <StatusPill label={s.label} tone={s.tone} />
        </View>
        <Text variant="callout" color="mutedForeground">
          {listingTypeLabel(listing.listingType)}
          {listing.unitName ? ` · ${listing.unitName}` : ''}
          {listing.availableFrom ? ` · from ${formatDate(listing.availableFrom, 'short')}` : ''}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {[listing.address, listing.city].filter(Boolean).join(', ')}
          {listing.ownerName ? ` · owner ${listing.ownerName}` : ''}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {listing.viewCount.toLocaleString('en-NG')} {listing.viewCount === 1 ? 'view' : 'views'}
          {' · '}listed {formatDate(listing.createdAt, 'short')}
        </Text>
      </View>

      {listing.status === 'PENDING_VERIFICATION' ? (
        <Text variant="caption" color="mutedForeground">
          This listing is being checked before it can go live. You can try publishing it again once
          the property’s details are verified.
        </Text>
      ) : null}

      {moves.length ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {moves.map((to) => (
            <Button
              key={to}
              label={MOVE_LABEL[to]}
              size="sm"
              variant={to === 'PUBLISHED' ? 'primary' : to === 'CLOSED' ? 'ghost' : 'secondary'}
              fullWidth={false}
              style={{ flex: 1 }}
              loading={move.isPending && move.variables === to}
              disabled={move.isPending}
              accessibilityLabel={`${MOVE_LABEL[to]} ${listingName(listing)}`}
              onPress={() => confirmMove(to)}
            />
          ))}
        </View>
      ) : (
        <Text variant="caption" color="mutedForeground">
          This listing is closed. Create a new listing to advertise the property again.
        </Text>
      )}

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            Photos
          </Text>
          <Text variant="caption" color="mutedForeground">
            {photos.length} of {MAX_LISTING_PHOTOS}
          </Text>
        </View>
        {photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {photos.map((p, i) => (
                <View key={p.key}>
                  <Image
                    source={{ uri: p.url }}
                    contentFit="cover"
                    accessibilityLabel={i === 0 ? 'Cover photo' : `Photo ${i + 1}`}
                    style={{ width: 96, height: 96, borderRadius: radius.md }}
                  />
                  {canEditPhotos ? (
                    <Pressable
                      onPress={() => confirmRemove(p.key, i + 1)}
                      disabled={removePhoto.isPending}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${i + 1}`}
                      hitSlop={8}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.background,
                        opacity: removePhoto.isPending ? 0.5 : 0.9,
                      }}
                    >
                      <X size={14} color={colors.foreground} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text variant="caption" color="mutedForeground">
            No photos of your own yet, so the listing shows the owner’s pictures, if any. Listings
            with good photos get more enquiries.
          </Text>
        )}
        {canEditPhotos && room > 0 ? (
          <Button
            label={photos.length ? 'Add more photos' : 'Add photos'}
            variant="secondary"
            size="sm"
            loading={addPhotos.isPending}
            icon={<ImagePlus size={16} color={colors.foreground} />}
            onPress={() => addPhotos.mutate()}
          />
        ) : null}
        {canEditPhotos ? (
          <Text variant="caption" color="mutedForeground">
            Photos belong to this listing, not the owner’s property. The first is the cover.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
