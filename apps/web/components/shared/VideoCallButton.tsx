'use client';

import { useEffect, useState } from 'react';
import { Video } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { videoCallState, type VideoCallJoin } from '@sureground/shared';
import { unwrap, type ApiResponse } from '@/lib/apiHelpers';

export const VideoCallButton = ({
  viewing,
  join,
  label = 'Join video call',
}: {
  viewing: { mode?: string; status: string; scheduledAt?: string | null };
  join: () => Promise<ApiResponse<VideoCallJoin>>;
  label?: string;
}) => {
  const [now, setNow] = useState(() => new Date());
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const call = videoCallState(viewing, now);
  if (call.state === 'none' || call.state === 'ended') return null;

  if (call.state === 'upcoming') {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Video className="h-3.5 w-3.5" />
        Video call opens{' '}
        {call.opensAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
    );
  }

  const open = async () => {
    setError(null);
    // Open the tab now, while the click still counts, then point it at the room.
    const tab = window.open('', '_blank');
    setJoining(true);
    try {
      const { joinUrl } = await unwrap(join());
      if (tab) {
        tab.opener = null;
        tab.location.href = joinUrl;
      } else {
        window.location.href = joinUrl;
      }
    } catch (reason) {
      tab?.close();
      setError(reason instanceof Error ? reason.message : 'Could not open the video call.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        variant="primary"
        size="sm"
        icon={<Video className="h-4 w-4" />}
        isLoading={joining}
        onClick={() => void open()}
      >
        {label}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
