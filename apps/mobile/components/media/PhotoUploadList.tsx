import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { AlertCircle } from '@sureground/icons/native';
import { Button, Progress, Text, useTheme } from '@sureground/ui-native';
import type { PendingPhoto } from '@/lib/usePhotoUploads';
import type { UploadState } from '@/lib/uploadQueue';

/** One row per new photo: progress with Cancel, then Processing; or the failure with Retry and Remove. */
export function PhotoUploadList({
  pending,
  states,
  failed,
  onRemove,
  onRetry,
}: {
  pending: PendingPhoto[];
  states: Record<string, UploadState>;
  failed: number;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const { colors, spacing } = useTheme();
  if (!pending.length) return null;
  return (
    <View style={{ gap: spacing.md }}>
      {pending.map((photo, i) => (
        <PhotoUploadRow
          key={photo.id}
          index={i}
          photo={photo}
          state={states[photo.id]}
          onRemove={() => onRemove(photo.id)}
          onRetry={() => onRetry(photo.id)}
        />
      ))}
      {failed > 0 ? (
        <Text variant="caption" style={{ color: colors.destructive }} accessibilityRole="alert">
          {failed === 1
            ? '1 photo did not upload. Retry it or remove it.'
            : `${failed} photos did not upload. Retry them or remove them.`}
        </Text>
      ) : null}
    </View>
  );
}

function PhotoUploadRow({
  index,
  photo,
  state,
  onRemove,
  onRetry,
}: {
  index: number;
  photo: PendingPhoto;
  state?: UploadState;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <UploadRow
      name={`new photo ${index + 1}`}
      state={state}
      onRemove={onRemove}
      onRetry={onRetry}
      preview={
        <Image
          source={{ uri: photo.file.uri }}
          style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.secondary }}
          contentFit="cover"
          accessible={false}
        />
      }
    />
  );
}

/**
 * One file's upload: progress with Cancel, then Processing; or the failure with its reason, Retry and Remove.
 * Shared by photos and the video tour.
 */
export function UploadRow({
  name,
  preview,
  state,
  onRemove,
  onRetry,
}: {
  /** Read out with the buttons, e.g. "new photo 2". */
  name: string;
  /** A 56pt square: the photo, or an icon for a video. */
  preview: ReactNode;
  /** None once the file is up and waiting to be added with the others. */
  state?: UploadState;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { colors, spacing } = useTheme();
  const failed = state?.status === 'failed';
  const progress = state ? state.progress : 100;
  const label = !state
    ? 'Uploaded'
    : state.status === 'failed'
      ? 'Upload failed'
      : state.status === 'queued'
        ? 'Waiting to upload'
        : state.progress >= 100
          ? 'Processing'
          : 'Uploading';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ opacity: failed ? 0.5 : 1 }}>{preview}</View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {failed ? <AlertCircle size={14} color={colors.destructive} /> : null}
          <Text
            variant="callout"
            style={[{ flex: 1, fontWeight: '600' }, failed ? { color: colors.destructive } : null]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {!failed ? (
            <Text variant="caption" color="mutedForeground">
              {progress}%
            </Text>
          ) : null}
        </View>
        {state?.status === 'failed' ? (
          <Text variant="caption" color="mutedForeground" numberOfLines={2}>
            {state.error}
          </Text>
        ) : (
          <Progress value={progress / 100} accessibilityLabel={`${label}, ${name}`} />
        )}
      </View>
      {failed ? (
        <View style={{ gap: spacing.xs }}>
          <Button
            label="Retry"
            size="sm"
            variant="outline"
            fullWidth={false}
            onPress={onRetry}
            accessibilityLabel={`Retry ${name}`}
          />
          <Button
            label="Remove"
            size="sm"
            variant="ghost"
            fullWidth={false}
            onPress={onRemove}
            accessibilityLabel={`Remove ${name}`}
          />
        </View>
      ) : state ? (
        <Button
          label="Cancel"
          size="sm"
          variant="ghost"
          fullWidth={false}
          onPress={onRemove}
          accessibilityLabel={`Cancel upload of ${name}`}
        />
      ) : null}
    </View>
  );
}
