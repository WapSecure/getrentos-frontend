'use client';

import { Info, PhoneOff, User } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface VideoCallSimulatorProps {
  /** Who would host the real call. */
  hostName: string;
  onEndDemo: () => void;
}

/**
 * A deliberately-labelled preview of the live video viewing screen.
 *
 * It is a mock-up, not a call: nothing connects, no camera or microphone is
 * used, and it makes no claims about the property. The real call is arranged and
 * hosted outside the app.
 */
export const VideoCallSimulator = ({ hostName, onEndDemo }: VideoCallSimulatorProps) => (
  <div className="rounded-2xl overflow-hidden bg-gray-900 border border-border">
    <div className="flex items-start gap-2 bg-amber-500/15 px-3 py-2">
      <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-200">
        Preview only — this is a demo of the viewing screen. No call is connected and your camera
        and microphone stay off.
      </p>
    </div>

    <div className="relative h-56 flex flex-col items-center justify-center gap-2 bg-gray-800">
      <User className="w-10 h-10 text-gray-500" />
      <p className="text-sm text-gray-300">Host video appears here</p>
      <p className="text-xs text-gray-500">in a real viewing with {hostName}</p>
    </div>

    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
          {hostName.charAt(0).toUpperCase()}
        </span>
        <span className="text-xs font-medium text-white/70">{hostName}</span>
      </div>
      <p className="text-xs text-gray-400">
        During a real viewing the host walks you through the property live, so you can ask about
        anything the photos and video tour do not show.
      </p>

      <Button variant="outline" fullWidth className="gap-2" onClick={onEndDemo}>
        <PhoneOff className="w-4 h-4" />
        Close preview
      </Button>
    </div>
  </div>
);
