import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ImagePlus, Star, X } from 'lucide-react-native';
import {
  Button,
  EmptyState,
  FormAlert,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi, type HostListing } from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { pickPhotos } from '@/lib/filePicker';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const MAX_PHOTOS = 20;

interface Photo {
  /** Storage key once uploaded; null while uploading. */
  key: string | null;
  uri: string;
  failed?: boolean;
}

/**
 * The listing's gallery. The first photo is the cover guests see in search.
 * Without photos of its own a listing shows the property's, so a host can
 * start from those and replace them when ready.
 */
export default function HostPhotos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const listings = useQuery({
    queryKey: qk.host.listings,
    queryFn: () => hostShortletsApi.listings(),
  });
  const l = listings.data?.items.find((x) => x.id === id);

  return listings.isPending ? (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xl,
        paddingTop: insets.top + spacing['4xl'],
      }}
    >
      <Skeleton height={300} radius={radius.lg} />
    </View>
  ) : !l ? (
    <EmptyState title="Listing not found" />
  ) : (
    <Gallery listing={l} key={l.id} />
  );
}

function Gallery({ listing: l }: { listing: HostListing }) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const usingProperty = l.imageKeys.length === 0 && l.images.length > 0;
  const initial = useMemo<Photo[]>(
    () => l.imageKeys.map((key, i) => ({ key, uri: l.images[i] ?? '' })),
    [l]
  );
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const uploading = photos.some((p) => !p.key && !p.failed);
  const keys = photos.filter((p) => p.key).map((p) => p.key!) as string[];
  const changed = JSON.stringify(keys) !== JSON.stringify(l.imageKeys);

  const add = async () => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.show(`Up to ${MAX_PHOTOS} photos. Remove one to add another.`, 'info');
      return;
    }
    const picked = await pickPhotos(room);
    if (!picked.length) return;
    const pending: Photo[] = picked.map((f) => ({ key: null, uri: f.uri }));
    setPhotos((cur) => [...cur, ...pending]);
    // Upload in parallel; each tile fills in as its upload lands.
    await Promise.all(
      picked.map(async (file) => {
        try {
          const { key } = await hostShortletsApi.uploadImage(file);
          setPhotos((cur) => cur.map((p) => (p.uri === file.uri ? { ...p, key } : p)));
        } catch {
          setPhotos((cur) => cur.map((p) => (p.uri === file.uri ? { ...p, failed: true } : p)));
        }
      })
    );
  };

  const makeCover = (i: number) => {
    void haptics.tap();
    setPhotos((cur) => [cur[i], ...cur.filter((_, j) => j !== i)]);
  };
  const remove = (i: number) => setPhotos((cur) => cur.filter((_, j) => j !== i));

  const save = useMutation({
    mutationFn: () => hostShortletsApi.update(l.id, { imageKeys: keys }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.listings });
      toast.show('Photos saved.', 'success');
      router.back();
    },
    onError: () => void haptics.error(),
  });

  const leave = () => {
    if (!changed) return router.back();
    Alert.alert('Discard photo changes?', 'Your new order and uploads won’t be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const tile = { width: '48%' as const, aspectRatio: 4 / 3, borderRadius: radius.lg };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Photos"
          title={`${photos.length} photo${photos.length === 1 ? '' : 's'}`}
          subtitle="Tap a photo to make it the cover"
          onBack={leave}
        />
        {usingProperty && photos.length === 0 ? (
          <FormAlert
            tone="info"
            message="Guests currently see the property’s photos. Add your own to choose what they see first."
          />
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {photos.map((p, i) => (
            <Pressable
              key={p.uri + i}
              onPress={() => (i ? makeCover(i) : undefined)}
              accessibilityRole="button"
              accessibilityLabel={
                i === 0 ? 'Cover photo' : `Photo ${i + 1}. Tap to make it the cover`
              }
              style={[tile, { overflow: 'hidden', backgroundColor: colors.secondary }]}
            >
              <Image
                source={{ uri: p.uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={150}
                accessibilityIgnoresInvertColors
              />
              {!p.key && !p.failed ? (
                <View
                  style={{
                    ...StyleFill,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
              {p.failed ? (
                <View
                  style={{
                    ...StyleFill,
                    backgroundColor: 'rgba(180,0,0,0.55)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacing.sm,
                  }}
                >
                  <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }} center>
                    Upload failed: remove and try again
                  </Text>
                </View>
              ) : null}
              {i === 0 && p.key ? (
                <View
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radius.full,
                    backgroundColor: colors.card,
                  }}
                >
                  <Star size={11} color={colors.warning} fill={colors.warning} />
                  <Text variant="caption" style={{ fontWeight: '700' }}>
                    Cover
                  </Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => remove(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} color="#fff" />
              </Pressable>
            </Pressable>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable
              onPress={add}
              accessibilityRole="button"
              accessibilityLabel="Add photos"
              style={[
                tile,
                {
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                },
              ]}
            >
              <ImagePlus size={26} color={colors.primary} />
              <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                Add photos
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text variant="caption" color="mutedForeground">
          Bright, landscape photos of the living room, bedroom and bathroom book best. Up to{' '}
          {MAX_PHOTOS}.
        </Text>
        {save.error ? (
          <FormAlert
            message={save.error instanceof ApiError ? save.error.message : 'Could not save.'}
          />
        ) : null}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Button
          label={uploading ? 'Uploading…' : 'Save photos'}
          disabled={!changed || uploading}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
    </View>
  );
}

const StyleFill = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };
