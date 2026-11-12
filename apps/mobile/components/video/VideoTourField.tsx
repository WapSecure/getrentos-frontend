import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';
import { Play, Trash2, Video } from '@sureground/icons/native';
import { Card, Divider, Text, useTheme, useToast } from '@sureground/ui-native';
import { ApiError } from '@/lib/api/client';
import { videoProblem } from '@sureground/shared';
import { pickVideo, recordVideo, type PickedVideo } from '@/lib/filePicker';
import type { UploadState, UploadTaskOptions } from '@/lib/uploadQueue';
import { UploadRow } from '@/components/media/PhotoUploadList';
import { VideoTourSheet } from './VideoTourSheet';
import { FilmedOnSite } from './FilmedOnSite';
import { locateRecording, type VideoOnSiteReport } from '@/lib/filmedOnSite';

const VIDEO_UPLOAD_FALLBACK = 'This video did not upload. Check your connection and try again.';
const isAbort = (e: unknown) => e instanceof Error && e.name === 'AbortError';

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
  videoUrl?: string | null;
  hasVideo: boolean;
  filmedOnSite?: boolean;
  /** Uploads and attaches the video; reports whole-percent progress and stops when `signal` aborts. */
  onUpload: (
    file: PickedVideo,
    onSite: VideoOnSiteReport | null,
    options: UploadTaskOptions
  ) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onExpired?: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [removing, setRemoving] = useState(false);
  const [watching, setWatching] = useState(false);
  // The upload in flight or the one that failed, kept for Retry; null when there is none.
  const [upload, setUpload] = useState<UploadState | null>(null);
  const pending = useRef<{ file: PickedVideo; onSite: VideoOnSiteReport | null } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = removing || upload != null;

  // Leaving the screen stops the upload.
  useEffect(() => () => controller.current?.abort(), []);

  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const send = async () => {
    const job = pending.current;
    if (!job) return;
    const ctrl = new AbortController();
    controller.current = ctrl;
    setUpload({ status: 'uploading', progress: 0 });
    try {
      await onUpload(job.file, job.onSite, {
        signal: ctrl.signal,
        onProgress: (progress) => {
          if (!ctrl.signal.aborted) setUpload({ status: 'uploading', progress });
        },
      });
      if (ctrl.signal.aborted) return;
      pending.current = null;
      setUpload(null);
      toast.show(hasVideo ? 'Video tour replaced.' : 'Video tour added.', 'success');
    } catch (e) {
      // A cancel has already cleared the row.
      if (ctrl.signal.aborted || isAbort(e)) return;
      setUpload({
        status: 'failed',
        progress: 0,
        error: e instanceof ApiError && e.message ? e.message : VIDEO_UPLOAD_FALLBACK,
      });
    } finally {
      if (controller.current === ctrl) controller.current = null;
    }
  };

  /** Cancel while sending, or Remove after a failure: either way the picked video is dropped. */
  const discard = () => {
    controller.current?.abort();
    controller.current = null;
    pending.current = null;
    setUpload(null);
  };

  const start = async (pick: () => Promise<PickedVideo | null>, filmed = false) => {
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
    const job = { file, onSite: null as VideoOnSiteReport | null };
    pending.current = job;
    setUpload({ status: 'uploading', progress: 0 });
    // Right after the camera closes: the phone is still where it filmed.
    if (filmed) job.onSite = await locateRecording().catch(() => null);
    // Cancelled while finding the location.
    if (pending.current !== job) return;
    await send();
  };

  const choose = () => {
    // The browser build has no camera flow worth offering; it picks a file.
    if (Platform.OS === 'web') {
      void start(pickVideo);
      return;
    }
    Alert.alert(hasVideo ? 'Replace the video tour' : 'Add a video tour', undefined, [
      { text: 'Film a walkthrough', onPress: () => void start(recordVideo, true) },
      { text: 'Choose from library', onPress: () => void start(pickVideo) },
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
          setRemoving(true);
          try {
            await onRemove();
            toast.show('Video tour removed.', 'success');
          } catch (e) {
            fail(e, 'Could not remove the video.');
          } finally {
            setRemoving(false);
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
        {upload ? (
          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            <UploadRow
              name="the video tour"
              state={upload}
              onRemove={discard}
              onRetry={() => void send()}
              preview={
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: radius.md,
                    backgroundColor: colors.secondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Video size={20} color={colors.primary} />
                </View>
              }
            />
            {upload.status === 'uploading' ? (
              <Text variant="caption" color="mutedForeground">
                Keep the app open until it finishes.
              </Text>
            ) : null}
          </View>
        ) : (
          <Pressable
            onPress={choose}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={hasVideo ? 'Replace the video tour' : 'Add a video tour'}
            accessibilityState={{ disabled: busy }}
            style={row}
          >
            <Video size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {hasVideo ? 'Replace the video tour' : 'Add a video tour'}
              </Text>
              <Text variant="caption" color="mutedForeground">
                Film at the property for a “Filmed on site” badge, or pick a clip. Up to 5 minutes.
              </Text>
            </View>
          </Pressable>
        )}
        {hasVideo ? (
          <>
            <Divider />
            <View style={row}>
              <Pressable
                onPress={() => setWatching(true)}
                disabled={!videoUrl}
                accessibilityRole="button"
                accessibilityLabel="Watch the video tour"
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
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Remove the video tour"
                accessibilityState={{ disabled: busy, busy: removing }}
                hitSlop={10}
              >
                {removing ? (
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
