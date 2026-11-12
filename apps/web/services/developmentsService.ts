import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { DevelopmentCheckKind, DevelopmentStage } from '@sureground/shared/showroom';

export type DevelopmentStatus = 'DRAFT' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'LIVE' | 'WITHDRAWN';
export type DevelopmentTitleType = 'CERTIFICATE_OF_OCCUPANCY' | 'GOVERNOR_CONSENT';
export type DevelopmentDocumentKind =
  | 'SITE_TITLE'
  | 'BUILDING_APPROVAL'
  | 'DIRECTOR_ID'
  | 'OTHER_APPROVAL';
export type DevelopmentPhotoKind = 'SITE_PHOTO' | 'RENDER';
export type DevelopmentCheckResult = 'PENDING' | 'PASSED' | 'FAILED';

export interface DevelopmentUnitType {
  id: string;
  name: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  priceFromNaira?: number;
  unitsTotal?: number;
  unitsAvailable?: number;
}

export interface DevelopmentInstalment {
  id: string;
  unitTypeId?: string;
  label: string;
  amountNaira?: number;
  percent?: number;
  dueWhen?: string;
}

/** The developer's own view. No storage keys: photos come with short-lived links. */
export interface DeveloperDevelopment {
  id: string;
  name: string;
  summary?: string;
  location: {
    addressLine: string;
    city: string;
    state: string;
    lga?: string;
    latitude?: number;
    longitude?: number;
  };
  stage: DevelopmentStage;
  expectedCompletion?: string;
  status: DevelopmentStatus;
  reviewVersion: number;
  titleType?: DevelopmentTitleType;
  titleReference?: string;
  planPermitReference?: string;
  planPermitAuthority?: string;
  directors: string[];
  salesEmail?: string;
  salesPhone?: string;
  reviewNote?: string;
  submittedAt?: string;
  liveAt?: string;
  checks: {
    kind: DevelopmentCheckKind;
    label: string;
    result: DevelopmentCheckResult;
    note?: string;
    checkedAt?: string;
  }[];
  documents: {
    id: string;
    kind: DevelopmentDocumentKind;
    label: string;
    fileName: string;
    createdAt: string;
  }[];
  photos: {
    id: string;
    kind: DevelopmentPhotoKind;
    url?: string;
    caption?: string;
    capturedAt?: string;
    position: number;
  }[];
  unitTypes: DevelopmentUnitType[];
  paymentPlan: { paidTo: 'DEVELOPER'; note?: string; instalments: DevelopmentInstalment[] };
  submissionGaps: string[];
  isPrincipal: boolean;
  firmKybStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  updatedAt: string;
}

export interface DeveloperDevelopmentSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  stage: DevelopmentStage;
  status: DevelopmentStatus;
  checksPassed: number;
  updatedAt: string;
}

export interface DevelopmentFields {
  name?: string;
  summary?: string | null;
  addressLine?: string;
  city?: string;
  state?: string;
  lga?: string | null;
  stage?: DevelopmentStage;
  expectedCompletion?: string | null;
  titleType?: DevelopmentTitleType | null;
  titleReference?: string | null;
  planPermitReference?: string | null;
  planPermitAuthority?: string | null;
  directors?: string[];
  salesEmail?: string | null;
  salesPhone?: string | null;
}

export type UnitTypeInput = Omit<DevelopmentUnitType, 'id'> & { id?: string };
export type InstalmentInput = Omit<DevelopmentInstalment, 'id'>;

export const DEVELOPMENT_STATUS_LABEL: Record<DevelopmentStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'With Sureground for checks',
  CHANGES_REQUESTED: 'Changes requested',
  LIVE: 'Live',
  WITHDRAWN: 'Withdrawn',
};

export const DOCUMENT_KIND_LABEL: Record<DevelopmentDocumentKind, string> = {
  SITE_TITLE: 'Title document',
  BUILDING_APPROVAL: 'Building plan approval',
  DIRECTOR_ID: "Director's ID",
  OTHER_APPROVAL: 'Other approval',
};

const BASE = '/agency/developments';
const at = (id: string, rest = '') => `${BASE}/${encodeURIComponent(id)}${rest}`;
const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const developmentsService = {
  list(): Promise<ApiResponse<DeveloperDevelopmentSummary[]>> {
    return safeCall(() => authFetch<DeveloperDevelopmentSummary[]>(BASE));
  },
  get(id: string): Promise<ApiResponse<DeveloperDevelopment>> {
    return safeCall(() => authFetch<DeveloperDevelopment>(at(id)));
  },
  create(
    fields: DevelopmentFields & { name: string; addressLine: string; city: string; state: string }
  ) {
    return safeCall(() => authFetch<DeveloperDevelopment>(BASE, json('POST', fields)));
  },
  update(id: string, fields: DevelopmentFields) {
    return safeCall(() => authFetch<DeveloperDevelopment>(at(id), json('PATCH', fields)));
  },
  replaceUnitTypes(id: string, unitTypes: UnitTypeInput[]) {
    return safeCall(() =>
      authFetch<DeveloperDevelopment>(at(id, '/unit-types'), json('PUT', { unitTypes }))
    );
  },
  replacePaymentPlan(id: string, note: string | null, instalments: InstalmentInput[]) {
    return safeCall(() =>
      authFetch<DeveloperDevelopment>(at(id, '/payment-plan'), json('PUT', { note, instalments }))
    );
  },
  addPhoto(
    id: string,
    file: File,
    kind: DevelopmentPhotoKind,
    caption?: string,
    capturedAt?: string
  ) {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    if (caption?.trim()) form.append('caption', caption.trim());
    if (capturedAt) form.append('capturedAt', capturedAt);
    return safeCall(() =>
      authFetch<DeveloperDevelopment>(at(id, '/photos'), { method: 'POST', body: form })
    );
  },
  removePhoto(id: string, photoId: string) {
    return safeCall(() =>
      authFetch<DeveloperDevelopment>(at(id, `/photos/${encodeURIComponent(photoId)}`), {
        method: 'DELETE',
      })
    );
  },
  addDocument(id: string, file: File, kind: DevelopmentDocumentKind, label: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    form.append('label', label);
    return safeCall(() =>
      authFetch<DeveloperDevelopment>(at(id, '/documents'), { method: 'POST', body: form })
    );
  },
  removeDocument(id: string, documentId: string) {
    return safeCall(() =>
      authFetch<DeveloperDevelopment>(at(id, `/documents/${encodeURIComponent(documentId)}`), {
        method: 'DELETE',
      })
    );
  },
  submit(id: string) {
    return safeCall(() => authFetch<DeveloperDevelopment>(at(id, '/submit'), { method: 'POST' }));
  },
  withdraw(id: string) {
    return safeCall(() => authFetch<DeveloperDevelopment>(at(id, '/withdraw'), { method: 'POST' }));
  },
};
