'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Check, CalendarCheck, PhoneCall } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { VideoCallSimulator } from './VideoCallSimulator';
import { tourRooms, videoViewingSlots } from '@/lib/tourRooms';
import type { TourModalMode } from '@/types/virtual-tour';

interface VirtualTourViewerModalProps {
  propertyTitle: string | null;
  initialMode?: TourModalMode;
  onClose: () => void;
}

const AGENT_NAME = 'Chidinma Nwosu';

export const VirtualTourViewerModal = ({
  propertyTitle,
  initialMode = 'tour',
  onClose,
}: VirtualTourViewerModalProps) => {
  const [mode, setMode] = useState<TourModalMode>(initialMode);
  const [roomIndex, setRoomIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [confirmedSlotId, setConfirmedSlotId] = useState<string | null>(null);

  const handleClose = () => {
    setMode(initialMode);
    setRoomIndex(0);
    setSelectedSlotId(null);
    setConfirmedSlotId(null);
    onClose();
  };

  const room = tourRooms[roomIndex];
  const confirmedSlot = videoViewingSlots.find((s) => s.id === confirmedSlotId);

  return (
    <Dialog open={!!propertyTitle} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <div className="p-4 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">{propertyTitle}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {mode === 'tour' && 'Self-guided virtual tour'}
            {mode === 'booking' && 'Book a live video viewing'}
            {mode === 'confirmed' && 'Video viewing scheduled'}
            {mode === 'call' && 'Live video viewing'}
          </DialogDescription>
        </div>

        {mode === 'tour' && (
          <div className="p-4">
            <div
              className={`relative h-56 rounded-xl bg-linear-to-br ${room.gradient} flex items-center justify-center`}
            >
              <button
                onClick={() => setRoomIndex((i) => (i - 1 + tourRooms.length) % tourRooms.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-800" />
              </button>
              <p className="text-sm font-medium text-gray-800/70">{room.name}</p>
              <button
                onClick={() => setRoomIndex((i) => (i + 1) % tourRooms.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-800" />
              </button>
            </div>

            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
              {tourRooms.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setRoomIndex(i)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    i === roomIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <p className="text-sm text-foreground mt-3">{room.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {room.highlights.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                >
                  <Check className="w-3 h-3 text-primary" />
                  {h}
                </span>
              ))}
            </div>

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
              An agent will walk you through the property live over video. Pick a time that works.
            </p>
            {videoViewingSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedSlotId === slot.id
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-medium text-foreground">{slot.label}</span>
              </button>
            ))}
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setMode('tour')}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!selectedSlotId}
                onClick={() => {
                  setConfirmedSlotId(selectedSlotId);
                  setMode('confirmed');
                }}
              >
                Confirm
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
                  Video viewing scheduled for {confirmedSlot?.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {AGENT_NAME} will call you on GetRentos video at the scheduled time.
                </p>
              </div>
            </div>

            <Button variant="primary" fullWidth className="gap-2" onClick={() => setMode('call')}>
              <PhoneCall className="w-4 h-4" />
              Join Call Now (Demo)
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setMode('tour')}>
              Back to Tour
            </Button>
          </div>
        )}

        {mode === 'call' && (
          <div className="p-4">
            <VideoCallSimulator agentName={AGENT_NAME} onEndCall={() => setMode('confirmed')} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
