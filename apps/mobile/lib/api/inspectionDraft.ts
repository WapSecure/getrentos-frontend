import { apiFetch } from './client';
import type { AgentInspectionType, RoomCondition } from './agent';

export interface InspectionDraftRoom {
  room: string;
  /** null when the photos are too unclear to judge. */
  condition: RoomCondition | null;
  notes: string;
  photosUsed: number;
  confidence: 'high' | 'low';
}

export interface InspectionChange {
  room: string;
  detail: string;
  kind: 'wear_and_tear' | 'possible_damage' | 'unclear';
  basis: 'photos' | 'recorded condition';
}

export interface InspectionDraft {
  taskId: string;
  type: AgentInspectionType;
  rooms: InspectionDraftRoom[];
  overallCondition: string | null;
  roomsWithoutPhotos: string[];
  moveIn: { inspectedOn: string; roomsCompared: number } | null;
  changes: InspectionChange[];
  photosUsed: number;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export const inspectionDraftApi = {
  /** Saves nothing. */
  draft: (
    taskId: string,
    body: {
      type: AgentInspectionType;
      rooms: { room: string; condition?: RoomCondition; notes?: string }[];
    }
  ) =>
    apiFetch<InspectionDraft>(`/agent/inspections/${taskId}/draft-report`, {
      method: 'POST',
      body,
    }),
};

/** Room labels match regardless of case and spacing, as on the server. */
export const roomKey = (room: string) => room.trim().replace(/\s+/g, ' ').toLowerCase();

export const CHANGE_LABEL: Record<InspectionChange['kind'], string> = {
  wear_and_tear: 'Wear and tear',
  possible_damage: 'Possible damage',
  unclear: 'Unclear',
};
