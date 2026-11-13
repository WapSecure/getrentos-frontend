import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type AdminDevelopmentStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'LIVE'
  | 'WITHDRAWN';
export type AdminDevelopmentQueue = 'IN_REVIEW' | 'LIVE' | 'CHANGES_REQUESTED' | 'ALL';
export type DevelopmentCheckKind =
  | 'DEVELOPER_CAC'
  | 'DIRECTOR_IDENTITY'
  | 'SITE_TITLE'
  | 'BUILDING_APPROVAL';
export type DevelopmentCheckResult = 'PENDING' | 'PASSED' | 'FAILED';

export interface AdminDevelopmentSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  stage: string;
  status: AdminDevelopmentStatus;
  checksPassed: number;
  developerName: string;
  submittedAt?: string;
  updatedAt: string;
}

export interface AdminDevelopmentCheck {
  kind: DevelopmentCheckKind;
  label: string;
  result: DevelopmentCheckResult;
  note?: string;
  checkedAt?: string;
  checkedByName?: string;
  checklist: { key: string; label: string; required: boolean }[];
  confirmedItems: string[];
  /** Why it cannot pass yet: the evidence is not on file. */
  evidenceGap?: string;
}

export interface AdminDevelopment {
  id: string;
  name: string;
  summary?: string;
  location: { addressLine: string; city: string; state: string; lga?: string };
  stage: string;
  expectedCompletion?: string;
  status: AdminDevelopmentStatus;
  reviewVersion: number;
  titleType?: string;
  titleReference?: string;
  planPermitReference?: string;
  planPermitAuthority?: string;
  directors: string[];
  reviewNote?: string;
  submittedAt?: string;
  liveAt?: string;
  checks: AdminDevelopmentCheck[];
  documents: { id: string; kind: string; label: string; fileName: string; createdAt: string }[];
  photos: {
    id: string;
    kind: 'SITE_PHOTO' | 'RENDER';
    url?: string;
    caption?: string;
    capturedAt?: string;
  }[];
  unitTypes: { id: string; name: string; priceFromNaira?: number }[];
  paymentPlan: { paidTo: 'DEVELOPER'; note?: string; instalments: { id: string; label: string }[] };
  developer: {
    organizationId: string;
    name: string;
    registeredName?: string;
    registrationNumber?: string;
    kybStatus?: string;
    kybDecidedAt?: string;
    agencyStatus?: string;
    verifiedLegalName?: string;
    verifiedDirectors: string[];
    cacVerifiedAt?: string;
  };
  liveBlockers: string[];
  updatedAt: string;
}

export interface UnansweredDevelopmentQuestion {
  id: string;
  unitTypeName?: string;
  excerpt: string;
  askedAt: string;
  ageDays: number;
  reminderCount: number;
  lastRemindedAt?: string;
}

export interface UnansweredDevelopmentGroup {
  developmentId: string;
  name: string;
  city: string;
  state: string;
  status: AdminDevelopmentStatus;
  firm: { organizationId: string; name: string };
  waiting: number;
  oldestAskedAt: string;
  lastRemindedAt?: string;
  questions: UnansweredDevelopmentQuestion[];
}

export interface UnansweredDevelopmentQuestions {
  total: number;
  shown: number;
  developments: UnansweredDevelopmentGroup[];
}

export interface DevelopmentReminderResult {
  developmentId: string;
  questions: number;
  recipients: number;
  remindedAt: string;
}

/** Buyers' questions to developers that have waited more than three days. The buyer is never contacted. */
export const adminDevelopmentQuestionsService = {
  unanswered(): Promise<ApiResponse<UnansweredDevelopmentQuestions>> {
    return safeCall(() =>
      authFetch<UnansweredDevelopmentQuestions>('/admin/development-enquiries/unanswered')
    );
  },
  /** Reminds the firm's editing seats now; audit-logged. */
  remind(developmentId: string): Promise<ApiResponse<DevelopmentReminderResult>> {
    return safeCall(() =>
      authFetch<DevelopmentReminderResult>(
        `/admin/development-enquiries/developments/${encodeURIComponent(developmentId)}/remind`,
        { method: 'POST' }
      )
    );
  },
};

const at = (id: string, rest = '') => `/admin/developments/${encodeURIComponent(id)}${rest}`;

export const adminDevelopmentsService = {
  list(status: AdminDevelopmentQueue): Promise<ApiResponse<AdminDevelopmentSummary[]>> {
    return safeCall(() =>
      authFetch<AdminDevelopmentSummary[]>(`/admin/developments?status=${status}`)
    );
  },
  get(id: string): Promise<ApiResponse<AdminDevelopment>> {
    return safeCall(() => authFetch<AdminDevelopment>(at(id)));
  },
  /** Short-lived link; every opening is audit-logged. */
  documentUrl(
    id: string,
    documentId: string
  ): Promise<ApiResponse<{ url: string; fileName: string }>> {
    return safeCall(() =>
      authFetch<{ url: string; fileName: string }>(
        at(id, `/documents/${encodeURIComponent(documentId)}`)
      )
    );
  },
  /** Needs step-up; `reviewVersion` makes a developer's edit in between a conflict, not a check. */
  recordCheck(
    d: Pick<AdminDevelopment, 'id' | 'reviewVersion'>,
    kind: DevelopmentCheckKind,
    result: DevelopmentCheckResult,
    confirmedItems: string[],
    note?: string
  ): Promise<ApiResponse<AdminDevelopment>> {
    return safeCall(() =>
      authFetch<AdminDevelopment>(at(d.id, `/checks/${kind}`), {
        method: 'POST',
        body: JSON.stringify({
          result,
          seenReviewVersion: d.reviewVersion,
          confirmedItems,
          ...(note?.trim() ? { note: note.trim() } : {}),
        }),
      })
    );
  },
  /** Needs step-up. */
  publish(
    d: Pick<AdminDevelopment, 'id' | 'reviewVersion'>
  ): Promise<ApiResponse<AdminDevelopment>> {
    return safeCall(() =>
      authFetch<AdminDevelopment>(at(d.id, '/publish'), {
        method: 'POST',
        body: JSON.stringify({ seenReviewVersion: d.reviewVersion }),
      })
    );
  },
  requestChanges(id: string, note: string): Promise<ApiResponse<AdminDevelopment>> {
    return safeCall(() =>
      authFetch<AdminDevelopment>(at(id, '/request-changes'), {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    );
  },
};

export const STATUS_BADGE: Record<
  AdminDevelopmentStatus,
  { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' }
> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  IN_REVIEW: { label: 'Awaiting checks', variant: 'info' },
  CHANGES_REQUESTED: { label: 'Sent back', variant: 'warning' },
  LIVE: { label: 'Live', variant: 'success' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
};
