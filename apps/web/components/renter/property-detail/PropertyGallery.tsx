'use client';

import { useState } from 'react';
import { Home, Camera, Play } from 'lucide-react';
import { tourRooms } from '@/lib/tourRooms';

interface PropertyGalleryProps {
  hasVirtualTour: boolean;
  onOpenTour: () => void;
}

export const PropertyGallery = ({ hasVirtualTour, onOpenTour }: PropertyGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = tourRooms[activeIndex];

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div
        className={`relative h-80 bg-linear-to-br ${active.gradient} flex items-center justify-center`}
      >
        <Home className="w-12 h-12 text-gray-700/40" />

        {hasVirtualTour && (
          <button
            onClick={onOpenTour}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full hover:bg-black/80 transition-colors"
          >
            <Camera className="w-3 h-3" />
            <span>360° Tour</span>
            <Play className="w-2 h-2 ml-0.5" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 p-2 bg-card overflow-x-auto">
        {tourRooms.map((room, i) => (
          <button
            key={room.id}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-20 h-14 rounded-lg bg-linear-to-br ${room.gradient} border-2 transition-colors ${
              i === activeIndex
                ? 'border-primary'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            title={room.name}
          />
        ))}
      </div>
    </div>
  );
};
