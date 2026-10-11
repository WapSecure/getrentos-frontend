import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { VideoOff } from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import { videoSource, type VideoStream } from '@getrentos/shared';
import { EmbedFrame } from './EmbedFrame';

/**
 * A listing's video tour, played in the app: an uploaded file in the native
 * player (fullscreen, picture in picture), or a pasted YouTube or Vimeo link
 * in that provider's own player. Nothing is handed off to the browser.
 */
export function VideoTourPlayer({
  url,
  stream,
  title,
  onExpired,
}: {
  url: string;
  /** The same upload as an adaptive stream, when it has been encoded. */
  stream?: VideoStream | null;
  title: string;
  /** The file's signed link stopped working: fetch a fresh one. Called once per link. */
  onExpired?: () => void;
}) {
  // A stream that fails falls back to the original upload for this viewing.
  const [streamFailed, setStreamFailed] = useState(false);
  const source = videoSource(url);
  if (!source) return <Unplayable />;
  if (source.kind === 'file') {
    // The browser build's <video> cannot play HLS outside Safari.
    const useStream = !streamFailed && Platform.OS !== 'web';
    return stream && useStream ? (
      <FilePlayer
        key={stream.hlsUrl}
        url={stream.hlsUrl}
        posterUrl={stream.posterUrl}
        title={title}
        onExpired={() => setStreamFailed(true)}
      />
    ) : (
      <FilePlayer
        key={source.url}
        url={source.url}
        posterUrl={stream?.posterUrl}
        title={title}
        onExpired={onExpired}
      />
    );
  }
  return <EmbedFrame url={source.embedUrl} title={title} />;
}

function FilePlayer({
  url,
  posterUrl,
  title,
  onExpired,
}: {
  url: string;
  posterUrl?: string;
  title: string;
  onExpired?: () => void;
}) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const asked = useRef(false);

  useEffect(() => {
    if (status === 'error' && !asked.current) {
      asked.current = true;
      onExpired?.();
    }
  }, [status, onExpired]);

  // With no way to fetch a fresh link, say so instead of a black box.
  if (status === 'error' && !onExpired) return <Unplayable />;
  return (
    <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        allowsPictureInPicture
        fullscreenOptions={{ enable: true }}
        accessibilityLabel={`${title} video tour`}
        style={{ width: '100%', height: '100%' }}
      />
      {/* A still while the first frames load, so a slow connection shows the place. */}
      {posterUrl && status === 'loading' ? (
        <Image
          source={{ uri: posterUrl }}
          contentFit="contain"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
          accessible={false}
        />
      ) : null}
    </View>
  );
}

function Unplayable() {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
      }}
    >
      <VideoOff size={26} color={colors.mutedForeground} />
      <Text variant="caption" color="mutedForeground">
        This video can’t be played.
      </Text>
    </View>
  );
}
