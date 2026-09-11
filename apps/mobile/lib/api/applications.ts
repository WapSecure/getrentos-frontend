import { apiFetch } from './client';
import type { Paginated } from './properties';

/** Mirrors the backend's `RentalApplicationStatus` enum, lowercased. */
export const APPLICATION_STATUSES = ['pending', 'under_review', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const APPLICATION_STATUS_TONE: Record<
  ApplicationStatus,
  'warning' | 'info' | 'success' | 'danger'
> = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'danger',
};

export interface ApplicationDocument {
  name: string;
  uploaded: boolean;
  required: boolean;
  /** Id of the file in the renter's document library, once uploaded. */
  documentId?: string;
  /** Short-lived signed download URL for the uploaded file. */
  url?: string;
}

/** The checklist every application starts with — mirrors the web wizard. */
export const DEFAULT_APPLICATION_DOCUMENTS: ApplicationDocument[] = [
  { name: 'Government ID', uploaded: false, required: true },
  { name: 'Proof of Income', uploaded: false, required: true },
  { name: 'Bank Statement', uploaded: false, required: true },
  { name: 'Reference Letter', uploaded: false, required: false },
];

export interface ApplicationTimelineStep {
  stage: string;
  date: string;
  completed: boolean;
}

/** One rental application, as returned by `/renter/applications`. Mirrors `RenterApplicationDto`. */
export interface RenterApplication {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  status: ApplicationStatus;
  date: string;
  price: number;
  period: 'month';
  bedrooms: number;
  bathrooms: number;
  size: number;
  image: string;
  applicationDate: string;
  moveInDate: string;
  leaseTerm: string;
  documents: ApplicationDocument[];
  landlord: {
    name: string;
    email: string;
    phone: string;
    responseRate: number;
    rating?: number;
  };
  applicationNotes?: string;
  timeline: ApplicationTimelineStep[];
}

export interface ApplicationReferenceInput {
  name: string;
  phone: string;
  relationship: string;
}

export interface SubmitApplicationInput {
  listingId: string;
  fullName: string;
  email: string;
  phone: string;
  currentAddress?: string;
  employer?: string;
  employmentStatus: string;
  monthlyIncome: number;
  moveInDate?: string;
  leaseTerm?: string;
  notes?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  references?: ApplicationReferenceInput[];
  documents: ApplicationDocument[];
}

export const applicationsApi = {
  list: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<RenterApplication>>(
      `/renter/applications?page=${page}&pageSize=${pageSize}`
    ),

  submit: (input: SubmitApplicationInput) =>
    apiFetch<RenterApplication>('/renter/applications', { method: 'POST', body: input }),

  withdraw: (id: string) =>
    apiFetch<RenterApplication>(`/renter/applications/${id}/withdraw`, { method: 'PATCH' }),
};
