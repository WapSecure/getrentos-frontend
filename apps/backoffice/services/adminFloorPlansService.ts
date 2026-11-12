import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type FloorPlanMeasurementStatus = 'ESTIMATED' | 'CHECKED';

/** One floor plan level and the sizes its lister gave (metres). */
export interface AdminFloorPlan {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyReference?: string;
  location: string;
  levelName: string;
  /** Signed, short-lived. */
  imageUrl?: string;
  measurementStatus: FloorPlanMeasurementStatus;
  checkedAt?: string;
  checkedByName?: string;
  rooms: {
    id: string;
    name: string;
    position: number;
    widthM?: number;
    lengthM?: number;
    planX?: number;
    planY?: number;
  }[];
  updatedAt: string;
}

export const adminFloorPlansService = {
  list(status: FloorPlanMeasurementStatus): Promise<ApiResponse<AdminFloorPlan[]>> {
    return safeCall(() => authFetch<AdminFloorPlan[]>(`/admin/floor-plans?status=${status}`));
  },
  /** Needs step-up; `seenUpdatedAt` makes a lister's edit in between a conflict, not a check. */
  setMeasurement(
    plan: Pick<AdminFloorPlan, 'id' | 'updatedAt'>,
    status: FloorPlanMeasurementStatus,
    note?: string
  ): Promise<ApiResponse<AdminFloorPlan>> {
    return safeCall(() =>
      authFetch<AdminFloorPlan>(`/admin/floor-plans/${encodeURIComponent(plan.id)}/measurement`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          seenUpdatedAt: plan.updatedAt,
          ...(note?.trim() ? { note: note.trim() } : {}),
        }),
      })
    );
  },
};
