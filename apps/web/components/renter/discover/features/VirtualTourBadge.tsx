'use client';

import { Play } from '@sureground/icons';

interface VirtualTourBadgeProps {
  hasTour: boolean;
  onOpenTour: () => void;
}

export const VirtualTourBadge = ({ hasTour, onOpenTour }: VirtualTourBadgeProps) => {
  if (!hasTour) return null;

  return (
    <button
      type="button"
      onClick={onOpenTour}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary pointer-coarse:h-11"
    >
      <Play className="h-3.5 w-3.5" aria-hidden="true" />
      Video tour
    </button>
  );
};
