'use client';

import { motion } from 'framer-motion';
import { Camera, Play } from 'lucide-react';

interface VirtualTourBadgeProps {
  hasTour: boolean;
  tourUrl?: string;
}

export const VirtualTourBadge = ({ hasTour, tourUrl }: VirtualTourBadgeProps) => {
  if (!hasTour) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute top-3 right-12 z-10"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.open(tourUrl, '_blank');
        }}
        className="flex items-center gap-1.5 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full hover:bg-black/80 transition-colors"
      >
        <Camera className="w-3 h-3" />
        <span>360° Tour</span>
        <Play className="w-2 h-2 ml-0.5" />
      </button>
    </motion.div>
  );
};
