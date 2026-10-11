import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { VideoOff } from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import { videoSource } from '@getrentos/shared';
import { EmbedFrame } from './EmbedFrame';

/**
 * A listing's video tour, played in the app: an uploaded file in the native
 * player (fullscreen, picture in picture), or a pasted YouTube or Vimeo link
 * in that provider's own player. Nothing is handed off to the browser.
 */
export function VideoTourPlayer({
  url,
  title,
  onExpired,
}: {
  url: string;
  title: string;
  /** The file's signed link stopped working: fetch a fresh one. Called once per link. */
  onExpired?: () => void;
}) {
  const source = videoSource(url);
  if (!source) return <Unplayable />;
  if (source.kind === 'file') {
    return <FilePlayer key={source.url} url={source.url} title={title} onExpired={onExpired} />;
  }
  return <EmbedFrame url={source.embedUrl} title={title} />;
}

function FilePlayer({
  url,
  title,
  onExpired,
}: {
  url: string;
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
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      allowsPictureInPicture
      fullscreenOptions={{ enable: true }}
      accessibilityLabel={`${title} video tour`}
      style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
    />
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
