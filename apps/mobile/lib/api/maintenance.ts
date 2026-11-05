import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';

export const MAINTENANCE_CATEGORIES = [
  'plumbing',
  'electrical',
  'internet',
  'security',
  'appliances',
  'other',
] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const MAINTENANCE_CATEGORY_LABEL: Record<MaintenanceCategory, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  internet: 'Internet',
  security: 'Security',
  appliances: 'Appliances',
  other: 'Other',
};

export const MAINTENANCE_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export const MAINTENANCE_PRIORITY_LABEL: Record<MaintenancePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export type MaintenanceStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

export const MAINTENANCE_STATUS_TONE: Record<
  MaintenanceStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  submitted: 'info',
  assigned: 'warning',
  in_progress: 'warning',
  resolved: 'success',
  cancelled: 'neutral',
};

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  isEmergency: boolean;
  images: string[];
  assignedVendorId?: string;
  assignedVendorName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  responseDueAt?: string;
  resolutionDueAt?: string;
  escalationDueAt?: string;
  acknowledgedAt?: string;
  escalatedAt?: string;
  vendorRating?: number;
}

export interface CreateMaintenanceInput {
  title: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  isEmergency?: boolean;
  photos?: PickedFile[];
}

/** A repair request drafted from photos, to check and send (web: types/repairDraft.ts). */
export interface RepairDraft {
  title: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  isEmergency: boolean;
  safetyNote: string | null;
  quickChecks: string[];
  unclear: boolean;
}

export const maintenanceApi = {
  list: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<MaintenanceRequest>>(
      `/renter/maintenance?page=${page}&pageSize=${pageSize}`
    ),

  create: (input: CreateMaintenanceInput) => {
    const form = new FormData();
    form.append('title', input.title);
    form.append('category', input.category);
    form.append('priority', input.priority);
    form.append('description', input.description);
    if (input.isEmergency) form.append('isEmergency', 'true');
    input.photos?.forEach((p) => appendFile(form, 'files', p));
    return apiUpload<MaintenanceRequest>('/renter/maintenance', form);
  },

  /** A repair request drafted from photos (and a note). Nothing is stored or sent. */
  draftFromPhotos: (photos: PickedFile[], note?: string) => {
    const form = new FormData();
    photos.slice(0, 3).forEach((p) => appendFile(form, 'files', p));
    if (note?.trim()) form.append('note', note.trim());
    return apiUpload<RepairDraft>('/renter/maintenance/photo-draft', form);
  },

  cancel: (id: string) =>
    apiFetch<MaintenanceRequest>(`/renter/maintenance/${id}/cancel`, { method: 'PATCH' }),

  rateVendor: (id: string, rating: number) =>
    apiFetch<MaintenanceRequest>(`/renter/maintenance/${id}/rate-vendor`, {
      method: 'PATCH',
      body: { rating },
    }),
};
