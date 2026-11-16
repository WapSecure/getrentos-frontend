import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { LastApplicationDetails } from '@sureground/shared';

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
  documentId?: string;
  /** Short-lived signed download URL for the uploaded file. */
  url?: string;
}

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

/** Never send `url` back: the API whitelist rejects unknown properties. */
export type ApplicationDocumentInput = Omit<ApplicationDocument, 'url'>;

export interface SubmitApplicationInput {
  listingId: string;
  fullName: string;
  email: string;
  phone: string;
  currentAddress?: string;
  /** The Google place the current address was picked from; the API checks it. */
  currentAddressPlaceId?: string;
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
  documents: ApplicationDocumentInput[];
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const applicationsApi = {
  /** The renter's own details from their latest application; null if none (or not supported yet). */
  lastDetails: () =>
    // An empty body comes back as undefined, which React Query refuses: no details is null.
    apiFetch<LastApplicationDetails | null>('/renter/applications/last-details')
      .then((details) => details ?? null)
      .catch(() => null),

  list: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<RenterApplication>>(
      `/renter/applications?page=${page}&pageSize=${pageSize}`
    ),

  submit: (input: SubmitApplicationInput) =>
    apiFetch<RenterApplication>('/renter/applications', { method: 'POST', body: input }),

  withdraw: (id: string) =>
    apiFetch<RenterApplication>(`/renter/applications/${id}/withdraw`, { method: 'PATCH' }),

  listNotes: (applicationId: string) =>
    apiFetch<ApplicationNote[]>(`/renter/applications/${applicationId}/notes`),

  createNote: (applicationId: string, content: string) =>
    apiFetch<ApplicationNote>(`/renter/applications/${applicationId}/notes`, {
      method: 'POST',
      body: { content },
    }),

  updateNote: (applicationId: string, noteId: string, content: string) =>
    apiFetch<ApplicationNote>(`/renter/applications/${applicationId}/notes/${noteId}`, {
      method: 'PATCH',
      body: { content },
    }),

  deleteNote: (applicationId: string, noteId: string) =>
    apiFetch<void>(`/renter/applications/${applicationId}/notes/${noteId}`, { method: 'DELETE' }),
};
