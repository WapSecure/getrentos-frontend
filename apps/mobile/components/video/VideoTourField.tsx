import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';
import { Play, Trash2, Video } from 'lucide-react-native';
import { Card, Divider, Text, useTheme, useToast } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { videoProblem } from '@getrentos/shared';
import { pickVideo, recordVideo, type PickedVideo } from '@/lib/filePicker';
import { VideoTourSheet } from './VideoTourSheet';
import { FilmedOnSite } from './FilmedOnSite';
import { locateRecording, type VideoOnSiteReport } from '@/lib/filmedOnSite';

/**
 * A property's or listing's video tour, for the person listing it: film a
 * walkthrough or pick a clip, watch what was uploaded, replace or remove it.
 * The caller does the upload and attaches the key; this only drives the flow.
 *
 * Filming in the app also reads where the phone is, so the server can mark the
 * tour "Filmed on site"; a clip from the library never carries that.
 */
export function VideoTourField({
  title,
  videoUrl,
  hasVideo,
  filmedOnSite,
  onUpload,
  onRemove,
  onExpired,
}: {
  title: string;
  /** Signed link to the current video, for the preview. */
  videoUrl?: string | null;
  hasVideo: boolean;
  /** The current video was filmed in the app at the property. */
  filmedOnSite?: boolean;
  /** Uploads the file and attaches it with where it was filmed, if known; rejects to show an error. */
  onUpload: (file: PickedVideo, onSite: VideoOnSiteReport | null) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onExpired?: () => void;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState<'uploading' | 'removing' | null>(null);
  const [watching, setWatching] = useState(false);

  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const upload = async (pick: () => Promise<PickedVideo | null>, filmed = false) => {
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
      // Right after the camera closes: the phone is still where it filmed.
      const onSite = filmed ? await locateRecording() : null;
      await onUpload(file, onSite);
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
      { text: 'Film a walkthrough', onPress: () => void upload(recordVideo, true) },
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
                : 'Film at the property for a “Filmed on site” badge, or pick a clip. Up to 5 minutes.'}
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
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Watch the video tour</Text>
                  {filmedOnSite ? <FilmedOnSite /> : null}
                </View>
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
