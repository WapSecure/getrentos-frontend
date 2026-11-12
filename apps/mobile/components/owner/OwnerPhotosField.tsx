import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { ImagePlus, Star, X } from '@sureground/icons/native';
import { Text, useTheme, useToast } from '@sureground/ui-native';
import { errorMessage } from '@/lib/api/client';
import { ownerApi, type OwnerProperty } from '@/lib/api/owner';
import { pickPhotos } from '@/lib/filePicker';
import { usePhotoUploads } from '@/lib/usePhotoUploads';
import { PhotoUploadList } from '@/components/media/PhotoUploadList';

const MAX_PHOTOS = 12;

export function OwnerPhotosField({
  property,
  onChanged,
}: {
  property: OwnerProperty;
  onChanged: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  // The API lists the cover first among the keys, with signed links in step.
  const keys = property.galleryImageKeys ?? [];
  const urls = property.galleryImageUrls ?? [];
  // Attaching replaces the whole list, so it builds on the newest one: a refetch may not have landed yet.
  const savedKeys = useRef(keys);
  useEffect(() => {
    savedKeys.current = property.galleryImageKeys ?? [];
  }, [property.galleryImageKeys]);

  const uploads = usePhotoUploads({
    upload: (file, options) => ownerApi.uploadPhoto(file, options),
    attach: async (added) => {
      const updated = await ownerApi.setPhotos(property.id, [...savedKeys.current, ...added]);
      savedKeys.current = updated.galleryImageKeys ?? [...savedKeys.current, ...added];
      onChanged();
      toast.show(added.length === 1 ? 'Photo added.' : `${added.length} photos added.`, 'success');
    },
  });
  // Cover and remove save the whole list too, so they wait until every new photo is in.
  const busy = saving || uploads.busy;

  const save = async (next: string[], success: string) => {
    setSaving(true);
    try {
      const updated = await ownerApi.setPhotos(property.id, next);
      savedKeys.current = updated.galleryImageKeys ?? next;
      onChanged();
      toast.show(success, 'success');
    } catch (e) {
      toast.show(errorMessage(e, 'Could not update the photos.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    const room = MAX_PHOTOS - keys.length - uploads.pending.length;
    if (room <= 0) {
      toast.show(`Up to ${MAX_PHOTOS} photos. Remove one to add another.`, 'info');
      return;
    }
    uploads.add(await pickPhotos(room));
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
                    <Text variant="caption" style={{ fontWeight: '700' }}>
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
                  backgroundColor: colors.scrim,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={13} color={colors.primaryForeground} />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => void add()}
            disabled={saving}
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
            {saving ? (
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
      <PhotoUploadList
        pending={uploads.pending}
        states={uploads.states}
        failed={uploads.failed}
        onRemove={uploads.remove}
        onRetry={uploads.retry}
      />
      <Text variant="caption" color="mutedForeground">
        {keys.length > 1 ? 'Tap a photo to make it the cover. ' : ''}Bright, landscape photos work
        best. Up to {MAX_PHOTOS}.
      </Text>
    </View>
  );
}
