import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { ImagePlus, Star, X } from 'lucide-react-native';
import { Text, useTheme, useToast } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { ownerApi, type OwnerProperty } from '@/lib/api/owner';
import { pickPhotos } from '@/lib/filePicker';

const MAX_PHOTOS = 12;

/**
 * The owner's property photos: add from the library, make one the cover, or
 * remove one. Each change saves straight away. The first photo is the cover
 * buyers see first.
 */
export function OwnerPhotosField({
  property,
  onChanged,
}: {
  property: OwnerProperty;
  onChanged: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  // The API lists the cover first among the keys, with signed links in step.
  const keys = property.galleryImageKeys ?? [];
  const urls = property.galleryImageUrls ?? [];

  const save = async (next: string[], success: string) => {
    setBusy(true);
    try {
      await ownerApi.setPhotos(property.id, next);
      onChanged();
      toast.show(success, 'success');
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not update the photos.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    const room = MAX_PHOTOS - keys.length;
    if (room <= 0) {
      toast.show(`Up to ${MAX_PHOTOS} photos. Remove one to add another.`, 'info');
      return;
    }
    const picked = await pickPhotos(room);
    if (!picked.length) return;
    setBusy(true);
    try {
      const uploaded = await Promise.all(
        picked.map((file) => ownerApi.uploadMedia(file, 'image').then((r) => r.key))
      );
      await ownerApi.setPhotos(property.id, [...keys, ...uploaded]);
      onChanged();
      toast.show(
        uploaded.length === 1 ? 'Photo added.' : `${uploaded.length} photos added.`,
        'success'
      );
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not add those photos.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = (i: number) => {
    if (keys.length === 1) {
      toast.show('Add another photo first: a property keeps at least one.', 'info');
      return;
    }
    Alert.alert('Remove this photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await save(
            keys.filter((_, j) => j !== i),
            'Photo removed.'
          );
          // Detached now, so the file can go; the server refuses if it is still in use.
          ownerApi.removeMedia(keys[i]).catch(() => undefined);
        },
      },
    ]);
  };

  const tile = { width: 120, height: 90, borderRadius: radius.md };

  return (
    <View style={{ gap: spacing.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {keys.map((key, i) => (
            // Two sibling buttons (choose cover, remove) over the photo: a button
            // inside a button is invalid on the web build.
            <View
              key={key}
              style={[tile, { overflow: 'hidden', backgroundColor: colors.secondary }]}
            >
              <Pressable
                onPress={() =>
                  i > 0 && !busy
                    ? void save([key, ...keys.filter((k) => k !== key)], 'Cover photo changed.')
                    : undefined
                }
                accessibilityRole="button"
                accessibilityLabel={
                  i === 0 ? 'Cover photo' : `Photo ${i + 1}. Tap to make it the cover`
                }
                style={{ width: '100%', height: '100%' }}
              >
                {urls[i] ? (
                  <Image
                    source={{ uri: urls[i] }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : null}
                {i === 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      left: 6,
                      top: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: radius.full,
                      backgroundColor: colors.card,
                    }}
                  >
                    <Star size={10} color={colors.warning} fill={colors.warning} />
                    <Text variant="caption" style={{ fontSize: 10, fontWeight: '700' }}>
                      Cover
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => remove(i)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: 6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={13} color="#fff" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => void add()}
            disabled={busy}
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
                gap: 4,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <ImagePlus size={22} color={colors.primary} />
                <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
                  Add photos
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
      <Text variant="caption" color="mutedForeground">
        {keys.length > 1 ? 'Tap a photo to make it the cover. ' : ''}Bright, landscape photos work
        best. Up to {MAX_PHOTOS}.
      </Text>
    </View>
  );
}
