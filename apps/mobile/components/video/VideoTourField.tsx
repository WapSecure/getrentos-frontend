import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';
import { Play, Trash2, Video } from 'lucide-react-native';
import { Card, Divider, Text, useTheme, useToast } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { videoProblem } from '@getrentos/shared';
import { pickVideo, recordVideo, type PickedVideo } from '@/lib/filePicker';
import { VideoTourSheet } from './VideoTourSheet';

/**
 * A property's or listing's video tour, for the person listing it: film a
 * walkthrough or pick a clip, watch what was uploaded, replace or remove it.
 * The caller does the upload and attaches the key; this only drives the flow.
 */
export function VideoTourField({
  title,
  videoUrl,
  hasVideo,
  onUpload,
  onRemove,
  onExpired,
}: {
  title: string;
  /** Signed link to the current video, for the preview. */
  videoUrl?: string | null;
  hasVideo: boolean;
  /** Uploads the file and attaches it; rejects to show an error. */
  onUpload: (file: PickedVideo) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onExpired?: () => void;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState<'uploading' | 'removing' | null>(null);
  const [watching, setWatching] = useState(false);

  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const upload = async (pick: () => Promise<PickedVideo | null>) => {
    let file: PickedVideo | null;
    try {
      file = await pick();
    } catch {
      toast.show('Couldn’t open the camera or library.', 'error');
      return;
    }
    if (!file) return;
    const problem = videoProblem({
      size: file.size,
      durationSeconds: file.durationMs != null ? file.durationMs / 1000 : undefined,
    });
    if (problem) {
      toast.show(problem, 'error');
      return;
    }
    setBusy('uploading');
    try {
      await onUpload(file);
      toast.show(hasVideo ? 'Video tour replaced.' : 'Video tour added.', 'success');
    } catch (e) {
      fail(e, 'Could not upload that video.');
    } finally {
      setBusy(null);
    }
  };

  const choose = () => {
    // The browser build has no camera flow worth offering; it picks a file.
    if (Platform.OS === 'web') {
      void upload(pickVideo);
      return;
    }
    Alert.alert(hasVideo ? 'Replace the video tour' : 'Add a video tour', undefined, [
      { text: 'Film a walkthrough', onPress: () => void upload(recordVideo) },
      { text: 'Choose from library', onPress: () => void upload(pickVideo) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const remove = () =>
    Alert.alert('Remove the video tour?', 'Viewers will no longer see it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy('removing');
          try {
            await onRemove();
            toast.show('Video tour removed.', 'success');
          } catch (e) {
            fail(e, 'Could not remove the video.');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  const row = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  } as const;

  return (
    <>
      <Card padding="none">
        <Pressable
          onPress={choose}
          disabled={busy != null}
          accessibilityRole="button"
          accessibilityLabel={hasVideo ? 'Replace the video tour' : 'Add a video tour'}
          style={row}
        >
          {busy === 'uploading' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Video size={18} color={colors.primary} />
          )}
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {busy === 'uploading'
                ? 'Uploading the video…'
                : hasVideo
                  ? 'Replace the video tour'
                  : 'Add a video tour'}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {busy === 'uploading'
                ? 'Keep the app open until it finishes.'
                : 'Film a walkthrough or pick a clip, up to 5 minutes.'}
            </Text>
          </View>
        </Pressable>
        {hasVideo ? (
          <>
            <Divider />
            <View style={row}>
              <Pressable
                onPress={() => setWatching(true)}
                disabled={!videoUrl}
                accessibilityRole="button"
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              >
                <Play size={18} color={colors.primary} />
                <Text variant="bodyStrong">Watch the video tour</Text>
              </Pressable>
              <Pressable
                onPress={remove}
                disabled={busy != null}
                accessibilityRole="button"
                accessibilityLabel="Remove the video tour"
                hitSlop={10}
              >
                {busy === 'removing' ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <Trash2 size={18} color={colors.mutedForeground} />
                )}
              </Pressable>
            </View>
          </>
        ) : null}
      </Card>
      {videoUrl ? (
        <VideoTourSheet
          open={watching}
          onClose={() => setWatching(false)}
          title={title}
          videoUrl={videoUrl}
          onExpired={onExpired}
        />
      ) : null}
    </>
  );
}
