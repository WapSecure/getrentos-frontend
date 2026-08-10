'use client';

import { useEffect, useState } from 'react';
import { PhoneOff, Mic, Video, User } from 'lucide-react';
import { tourRooms } from '@/lib/tourRooms';

const narration = [
  "Hi! I'm Chidinma, your GetRentos agent. We're in the living room — check out that natural light.",
  'Now in the kitchen — fully fitted with granite countertops and space for a gas cooker.',
  'This is the master bedroom, with the en-suite just through that door.',
  "Here's the bathroom — modern tiling and a walk-in shower with constant water supply.",
  'And finally, the compound — gated with 24-hour security on site.',
];

interface VideoCallSimulatorProps {
  agentName: string;
  onEndCall: () => void;
}

export const VideoCallSimulator = ({ agentName, onEndCall }: VideoCallSimulatorProps) => {
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const captionTimer = window.setInterval(() => {
      setStep((prev) => (prev + 1) % narration.length);
    }, 4000);
    const clock = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      window.clearInterval(captionTimer);
      window.clearInterval(clock);
    };
  }, []);

  const room = tourRooms[step % tourRooms.length];
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="rounded-2xl overflow-hidden bg-gray-900">
      <div
        className={`relative h-72 bg-linear-to-br ${room.gradient} flex items-center justify-center`}
      >
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE {mm}:{ss}
        </div>
        <p className="text-sm font-medium text-gray-800/70">{room.name}</p>

        <div className="absolute bottom-3 right-3 w-20 h-16 rounded-lg bg-gray-800 border-2 border-white/20 flex items-center justify-center">
          <User className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
            {agentName.charAt(0)}
          </span>
          <span className="text-xs font-medium text-white/70">{agentName}</span>
        </div>
        <p className="text-sm text-white min-h-[2.5rem]">{narration[step]}</p>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button className="p-2.5 rounded-full bg-gray-700 text-white">
            <Mic className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-full bg-gray-700 text-white">
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={onEndCall}
            className="p-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
