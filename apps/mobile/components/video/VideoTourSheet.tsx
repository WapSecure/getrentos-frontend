import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from '@sureground/icons/native';
import { Chip, Text } from '@sureground/ui-native';
import { tourSource, type VideoStream } from '@sureground/shared';
import { EmbedFrame } from './EmbedFrame';
import { VideoTourPlayer } from './VideoTourPlayer';

const ON_VIDEO = { bg: '#000', fg: '#fff' };

export function VideoTourSheet({
  open,
  onClose,
  title,
  videoUrl,
  videoStream,
  tourUrl,
  onExpired,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  videoUrl?: string | null;
  videoStream?: VideoStream | null;
  tourUrl?: string | null;
  onExpired?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const tour = tourSource(tourUrl);
  const [view, setView] = useState<'video' | 'tour'>(videoUrl ? 'video' : 'tour');
  const showing = view === 'video' && videoUrl ? 'video' : tour ? 'tour' : 'video';

  return (
    <Modal
      visible={open}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={{ flex: 1, backgroundColor: ON_VIDEO.bg, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1, color: ON_VIDEO.fg }}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close the tour"
            hitSlop={12}
          >
            <X size={24} color={ON_VIDEO.fg} />
          </Pressable>
        </View>
        {videoUrl && tour ? (
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
            <Chip label="Video" selected={showing === 'video'} onPress={() => setView('video')} />
            <Chip label="360° tour" selected={showing === 'tour'} onPress={() => setView('tour')} />
          </View>
        ) : null}
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: insets.bottom }}>
          {open && showing === 'video' && videoUrl ? (
            <VideoTourPlayer
              url={videoUrl}
              stream={videoStream}
              title={title}
              onExpired={onExpired}
            />
          ) : open && showing === 'tour' && tour ? (
            <EmbedFrame url={tour.embedUrl} title={`${title} 360° tour`} fill />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
