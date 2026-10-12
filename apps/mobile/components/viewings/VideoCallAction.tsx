import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Video } from 'lucide-react-native';
import { Button, Text, useTheme, useToast } from '@getrentos/ui-native';
import { videoCallState, type VideoCallJoin } from '@getrentos/shared';
import { ApiError } from '@/lib/api/client';
import { formatDate, formatTime } from '@/lib/format';

/**
 * "Join video call" on a confirmed video viewing. Until the call opens it says
 * when it will; once open it fetches a personal link and opens the room in the
 * in-app browser, which has the camera and microphone.
 */
export function VideoCallAction({
  viewing,
  join,
  label = 'Join video call',
}: {
  viewing: { mode?: string; status: string; scheduledAt?: string | null };
  join: () => Promise<VideoCallJoin>;
  label?: string;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [now, setNow] = useState(() => new Date());
  const [joining, setJoining] = useState(false);

  // Re-check every half minute so the button opens on time.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const call = videoCallState(viewing, now);
  if (call.state === 'none' || call.state === 'ended') return null;

  if (call.state === 'upcoming') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Video size={14} color={colors.mutedForeground} />
        <Text variant="caption" color="mutedForeground">
          Video call opens {formatDate(call.opensAt, 'short')}, {formatTime(call.opensAt)}
        </Text>
      </View>
    );
  }

  const open = async () => {
    setJoining(true);
    try {
      const { joinUrl } = await join();
      if (Platform.OS === 'web') window.open(joinUrl, '_blank', 'noopener');
      else await WebBrowser.openBrowserAsync(joinUrl);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not open the video call.', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Button
      label={label}
      size="sm"
      loading={joining}
      icon={<Video size={16} color={colors.primaryForeground} />}
      onPress={() => void open()}
    />
  );
}
