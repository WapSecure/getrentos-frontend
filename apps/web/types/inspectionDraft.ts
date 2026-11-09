import type { RoomCondition } from '@/types/agent';

export interface InspectionDraft {
  rooms: {
    room: string;
    /** null when the photos are too unclear to judge. */
    condition: RoomCondition | null;
    notes: string;
    photosUsed: number;
    confidence: 'high' | 'low';
  }[];
  overallCondition: string | null;
  roomsWithoutPhotos: string[];
  moveIn: { inspectedOn: string; roomsCompared: number } | null;
  changes: {
    room: string;
    detail: string;
    kind: 'wear_and_tear' | 'possible_damage' | 'unclear';
    basis: 'photos' | 'recorded condition';
  }[];
  photosUsed: number;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export interface InspectionDraftRequest {
  type: 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';
  rooms: { room: string; condition?: RoomCondition; notes?: string }[];
}
