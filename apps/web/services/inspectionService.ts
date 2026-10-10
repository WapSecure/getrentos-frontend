import { authFetch, safeCall, toQuery, type ApiResponse, type Paginated } from '@/lib/apiHelpers';

/** Mirrors the backend's `PropertyInspectionType`. */
export const INSPECTION_TYPES = ['MOVE_IN', 'MOVE_OUT', 'ROUTINE'] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  MOVE_IN: 'Move-in',
  MOVE_OUT: 'Move-out',
  ROUTINE: 'Routine',
};

/** Mirrors the backend's `PropertyInspectionStatus`. */
export const INSPECTION_STATUSES = ['DRAFT', 'COMPLETED', 'SHARED'] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  DRAFT: 'Draft',
  COMPLETED: 'Completed',
  SHARED: 'Shared with owner',
};

/** Mirrors the backend's `PropertyInspectionItemCondition`. */
export const INSPECTION_CONDITIONS = ['GOOD', 'FAIR', 'POOR', 'DAMAGED'] as const;
export type InspectionCondition = (typeof INSPECTION_CONDITIONS)[number];

export const INSPECTION_CONDITION_LABELS: Record<InspectionCondition, string> = {
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
  DAMAGED: 'Damaged',
};

export interface InspectionPhoto {
  id: string;
  name: string;
  caption: string | null;
  /** Short-lived signed URL; refetched with the inspection. */
  url: string;
}

export interface InspectionItem {
  id: string;
  area: string;
  condition: InspectionCondition;
  notes: string | null;
  /** Estimated remedial cost in whole naira. */
  estimatedCost: number | null;
  photos: InspectionPhoto[];
}

export interface InspectionSummary {
  itemCount: number;
  conditionCounts: Record<InspectionCondition, number>;
  estimatedRemedialCost: number;
  hasRemedialFindings: boolean;
}

export interface InspectionListItem {
  id: string;
  propertyId: string;
  propertyTitle: string | null;
  leaseId: string | null;
  type: InspectionType;
  status: InspectionStatus;
  scheduledFor: string | null;
  conductedAt: string | null;
  itemCount: number;
  estimatedRemedialCost: number;
  createdAt: string;
}

export interface InspectionDetail extends InspectionListItem {
  mandateId: string | null;
  summaryNotes: string | null;
  sharedAt: string | null;
  conductedById: string;
  conductedByName: string | null;
  items: InspectionItem[];
  summary: InspectionSummary;
}

export interface CreateInspectionInput {
  propertyId: string;
  leaseId?: string;
  type: InspectionType;
  scheduledFor?: string;
  summaryNotes?: string;
}

export interface AddInspectionItemInput {
  area: string;
  condition: InspectionCondition;
  notes?: string;
  estimatedCost?: number;
}

export interface ListInspectionsParams {
  propertyId?: string;
  leaseId?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  page?: number;
  pageSize?: number;
}

export const inspectionService = {
  list(params: ListInspectionsParams = {}): Promise<ApiResponse<Paginated<InspectionListItem>>> {
    return safeCall(() =>
      authFetch<Paginated<InspectionListItem>>(
        `/inspections${toQuery(params as Record<string, string | number | boolean | undefined>)}`
      )
    );
  },

  get(id: string): Promise<ApiResponse<InspectionDetail>> {
    return safeCall(() => authFetch<InspectionDetail>(`/inspections/${id}`));
  },

  create(data: CreateInspectionInput): Promise<ApiResponse<InspectionDetail>> {
    return safeCall(() =>
      authFetch<InspectionDetail>('/inspections', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  addItem(id: string, data: AddInspectionItemInput): Promise<ApiResponse<InspectionDetail>> {
    return safeCall(() =>
      authFetch<InspectionDetail>(`/inspections/${id}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  addPhoto(
    id: string,
    itemId: string,
    file: File,
    caption?: string
  ): Promise<ApiResponse<InspectionDetail>> {
    const form = new FormData();
    if (caption) form.append('caption', caption);
    form.append('file', file);
    return safeCall(() =>
      authFetch<InspectionDetail>(`/inspections/${id}/items/${itemId}/photos`, {
        method: 'POST',
        body: form,
      })
    );
  },

  complete(id: string): Promise<ApiResponse<InspectionDetail>> {
    return safeCall(() =>
      authFetch<InspectionDetail>(`/inspections/${id}/complete`, { method: 'POST' })
    );
  },

  share(id: string): Promise<ApiResponse<InspectionDetail>> {
    return safeCall(() =>
      authFetch<InspectionDetail>(`/inspections/${id}/share`, { method: 'POST' })
    );
  },
};
