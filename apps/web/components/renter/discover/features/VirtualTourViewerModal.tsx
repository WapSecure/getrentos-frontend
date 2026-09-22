'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CalendarCheck, PhoneCall, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { VideoCallSimulator } from './VideoCallSimulator';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { DateTimeField, isFutureDateTime } from '@/components/shared/forms/DateTimeField';
import type { TourModalMode } from '@/types/virtual-tour';

interface VirtualTourViewerModalProps {
  propertyTitle: string | null;
  propertyId: string | null;
  /** The landlord's uploaded walkthrough video, when the property has one. */
  videoTourUrl?: string;
  /** Shown to the renter as the person who will host a live viewing. */
  hostName?: string;
  initialMode?: TourModalMode;
  onClose: () => void;
}

export const VirtualTourViewerModal = ({
  propertyTitle,
  propertyId,
  videoTourUrl,
  hostName,
  initialMode = 'tour',
  onClose,
}: VirtualTourViewerModalProps) => {
  const [mode, setMode] = useState<TourModalMode>(initialMode);
  const [preferredTime, setPreferredTime] = useState('');
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null);

  const host = hostName ?? 'the landlord';

  const requestViewing = useMutation({
    mutationFn: (requestedFor: string) =>
      unwrap(
        renterService.requestViewing(propertyId!, undefined, new Date(requestedFor).toISOString())
      ),
    onSuccess: () => {
      setConfirmedTime(preferredTime);
      setMode('confirmed');
    },
  });

  const handleClose = () => {
    setMode(initialMode);
    setPreferredTime('');
    setConfirmedTime(null);
    requestViewing.reset();
    onClose();
  };

  const formattedRequest = confirmedTime ? new Date(confirmedTime).toLocaleString() : '';

  return (
    <Dialog open={!!propertyTitle} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <div className="p-4 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">{propertyTitle}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {mode === 'tour' && (videoTourUrl ? 'Walkthrough video' : 'No video tour yet')}
            {mode === 'booking' && 'Book a live video viewing'}
            {mode === 'confirmed' && 'Viewing requested'}
            {mode === 'call' && 'Video viewing demo'}
          </DialogDescription>
        </div>

        {mode === 'tour' && (
          <div className="p-4">
            {videoTourUrl ? (
              <video
                src={videoTourUrl}
                controls
                autoPlay
                playsInline
                className="w-full rounded-xl bg-black"
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Video className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  This property has no video tour yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask {host} for a live video viewing and they can walk you through it.
                </p>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              className="gap-2 mt-4"
              onClick={() => setMode('booking')}
            >
              <Video className="w-4 h-4" />
              Book a Live Video Viewing
            </Button>
          </div>
        )}

        {mode === 'booking' && (
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {host} will confirm a time to walk you through the property over video.
            </p>

            <DateTimeField
              label="Preferred date and time"
              value={preferredTime}
              onChange={setPreferredTime}
              requireFuture
            />

            {requestViewing.isError && (
              <p className="text-xs text-red-500">
                Couldn&apos;t submit your viewing request. Please try again.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setMode('tour')}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={
                  !isFutureDateTime(preferredTime) || !propertyId || requestViewing.isPending
                }
                onClick={() => requestViewing.mutate(new Date(preferredTime).toLocaleString())}
              >
                {requestViewing.isPending ? 'Submitting…' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}

        {mode === 'confirmed' && (
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary">
              <CalendarCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Viewing request sent for {formattedRequest}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {host} will confirm your requested time — you&apos;ll see it in your viewing
                  requests once confirmed.
                </p>
              </div>
            </div>

            <Button variant="primary" fullWidth className="gap-2" onClick={() => setMode('call')}>
              <PhoneCall className="w-4 h-4" />
              Preview the Video Viewing
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setMode('tour')}>
              Back to Video Tour
            </Button>
          </div>
        )}

        {mode === 'call' && (
          <div className="p-4">
            <VideoCallSimulator hostName={host} onEndDemo={() => setMode('confirmed')} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
