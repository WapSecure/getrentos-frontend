import { Linking } from 'react-native';
import { Video } from '@sureground/icons/native';
import { Button, useTheme } from '@sureground/ui-native';
import type { SiteTourStatus, VideoCallJoin } from '@sureground/shared';
import { VideoCallAction } from '@/components/viewings/VideoCallAction';

/**
 * Joining a booked tour, as on web: the built-in call opens through `join` within its window;
 * otherwise the seller's own link opens.
 */
export function TourJoin({
  tour,
  join,
}: {
  tour: {
    status: SiteTourStatus;
    scheduledAt?: string | null;
    meetingUrl?: string | null;
    videoCall?: 'BUILT_IN' | 'LINK' | null;
  };
  join: () => Promise<VideoCallJoin>;
}) {
  const { colors } = useTheme();
  if (tour.status !== 'SCHEDULED') return null;
  if (tour.videoCall === 'BUILT_IN' && tour.scheduledAt) {
    return (
      <VideoCallAction
        viewing={{ mode: 'video', status: 'confirmed', scheduledAt: tour.scheduledAt }}
        join={join}
        label="Join the video call"
      />
    );
  }
  if (!tour.meetingUrl) return null;
  const url = tour.meetingUrl;
  return (
    <Button
      label="Join the video call"
      size="sm"
      icon={<Video size={16} color={colors.primaryForeground} />}
      onPress={() => void Linking.openURL(url)}
      style={{ alignSelf: 'flex-start' }}
    />
  );
}
