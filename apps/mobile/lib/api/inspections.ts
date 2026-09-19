import { apiFetch } from './client';

export type InspectionType = 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'OTHER';

export const INSPECTION_TYPE_LABEL: Record<InspectionType, string> = {
  MOVE_IN: 'Move-in',
  MOVE_OUT: 'Move-out',
  PERIODIC: 'Periodic',
  OTHER: 'Other',
};

export type RoomCondition = 'excellent' | 'good' | 'fair' | 'poor';

export const ROOM_CONDITION_LABEL: Record<RoomCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export const ROOM_CONDITION_TONE: Record<RoomCondition, 'success' | 'warning' | 'danger'> = {
  excellent: 'success',
  good: 'success',
  fair: 'warning',
  poor: 'danger',
};

export interface InspectionRoom {
  room: string;
  condition: RoomCondition;
  notes?: string;
  photoCount?: number;
}

export interface Inspection {
  id: string;
  propertyId: string;
  clientName?: string | null;
  scheduledAt: string;
  status: string;
  type: InspectionType;
  rooms: InspectionRoom[];
  overallCondition?: string | null;
  submittedAt?: string | null;
  acknowledgedAt?: string | null;
  acknowledgedById?: string | null;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
}

export const inspectionsApi = {
  list: () => apiFetch<Inspection[]>('/renter/inspections'),
  acknowledge: (id: string) =>
    apiFetch<Inspection>(`/renter/inspections/${id}/acknowledge`, { method: 'POST' }),
};
