export interface TourRoom {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  gradient: string;
}

export interface VideoViewingSlot {
  id: string;
  label: string;
}

export type TourModalMode = 'tour' | 'booking' | 'confirmed' | 'call';
