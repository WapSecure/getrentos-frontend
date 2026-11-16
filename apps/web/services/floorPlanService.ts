import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/** Sizes are metres; both sides or neither. */
export interface FloorPlanRoom {
  id?: string;
  name: string;
  widthM?: number | null;
  lengthM?: number | null;
  photoKey?: string | null;
  /** Tap target on the plan image, % from the top left. Both or neither. */
  planX?: number | null;
  planY?: number | null;
}

export interface FloorPlan {
  id: string;
  levelName: string;
  position: number;
  imageKey: string;
  measurementStatus: 'ESTIMATED' | 'CHECKED';
  checkedAt?: string;
  rooms: FloorPlanRoom[];
  updatedAt: string;
}

export interface FloorPlanInput {
  levelName: string;
  position?: number;
  imageKey: string;
  rooms: Omit<FloorPlanRoom, 'id'>[];
}

const base = (propertyId: string) =>
  `/landlord/properties/${encodeURIComponent(propertyId)}/floor-plans`;

export const floorPlanService = {
  list(propertyId: string): Promise<ApiResponse<FloorPlan[]>> {
    return safeCall(() => authFetch<FloorPlan[]>(base(propertyId)));
  },
  create(propertyId: string, input: FloorPlanInput): Promise<ApiResponse<FloorPlan>> {
    return safeCall(() =>
      authFetch<FloorPlan>(base(propertyId), { method: 'POST', body: JSON.stringify(input) })
    );
  },
  update(
    propertyId: string,
    planId: string,
    input: Partial<FloorPlanInput>
  ): Promise<ApiResponse<FloorPlan>> {
    return safeCall(() =>
      authFetch<FloorPlan>(`${base(propertyId)}/${encodeURIComponent(planId)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    );
  },
  remove(propertyId: string, planId: string): Promise<ApiResponse<{ deleted: true }>> {
    return safeCall(() =>
      authFetch<{ deleted: true }>(`${base(propertyId)}/${encodeURIComponent(planId)}`, {
        method: 'DELETE',
      })
    );
  },
};
