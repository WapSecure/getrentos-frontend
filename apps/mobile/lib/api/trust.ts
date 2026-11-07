import type { BadgeTone } from '@getrentos/ui-native';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Portal } from '../roles';

/**
 * The trust orchestrator's identity checks: the verification centre on web
 * (components/shared/verification/VerificationCenter.tsx).
 */

export type TrustPurpose =
  | 'RENTER_ONBOARDING'
  | 'LANDLORD_ONBOARDING'
  | 'AGENT_ONBOARDING'
  | 'PROPERTY_OWNER_ONBOARDING'
  | 'PROPERTY_MANAGER_ONBOARDING';

/** Which onboarding policy each workspace verifies against (web's per-role pages). */
export function purposeFor(portal: Portal | null | undefined): TrustPurpose {
  switch (portal) {
    case 'landlord':
      return 'LANDLORD_ONBOARDING';
    case 'owner':
      return 'PROPERTY_OWNER_ONBOARDING';
    case 'agent':
    case 'realtor':
      return 'AGENT_ONBOARDING';
    case 'manager':
      return 'PROPERTY_MANAGER_ONBOARDING';
    default:
      return 'RENTER_ONBOARDING';
  }
}

export type TrustIdType = 'NIN' | 'BVN' | 'PASSPORT' | 'DRIVERS_LICENCE';
export const TRUST_ID_TYPES: { value: TrustIdType; label: string }[] = [
  { value: 'NIN', label: 'NIN' },
  { value: 'BVN', label: 'BVN' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVERS_LICENCE', label: 'Driver’s licence' },
];

export const PROFESSIONAL_DOCUMENT_TYPES = [
  { value: 'AGENT_LICENSE', label: 'Agent licence' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'LETTER_OF_AUTHORITY', label: 'Letter of authority' },
  { value: 'PROFESSIONAL_ID', label: 'Professional ID' },
];

export interface TrustVerification {
  id: string;
  purpose: string;
  status: string;
  decision: string;
  stepCount: number;
  passedSteps: number;
  completedAt?: string | null;
}

export interface TrustStep {
  id: string;
  stepType: string;
  status: string;
  provider?: string | null;
  attempts: number;
}

export interface TrustVerificationDetail extends TrustVerification {
  steps: TrustStep[];
  decisions: { id: string; decision: string; reasonCodes: string[]; createdAt: string }[];
}

export type ConsentType = 'ID_CHECK' | 'BIOMETRIC' | 'BANK_ACCOUNT_CHECK' | 'DOCUMENT_PROCESSING';

export interface TrustConsent {
  id: string;
  consentType: string;
  purpose?: string;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
}

export type AppealStatus = 'OPEN' | 'UNDER_REVIEW' | 'UPHELD' | 'OVERTURNED' | 'CLOSED';
export interface TrustAppeal {
  id: string;
  targetType: string;
  targetId: string;
  status: AppealStatus;
  reason: string;
  resolution?: string | null;
}

export const STEP_LABEL: Record<string, string> = {
  PHONE_OTP: 'Phone number',
  NIN_CHECK: 'National ID (NIN)',
  BVN_CHECK: 'Bank verification number (BVN)',
  SELFIE_CAPTURE: 'Selfie',
  LIVENESS_CHECK: 'Liveness check',
  FACE_MATCH: 'Face match',
  DOCUMENT_CHECK: 'Professional document',
  BANK_ACCOUNT_CHECK: 'Bank account',
  AML_CHECK: 'Anti-money-laundering screening',
};

export const STEP_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PASSED: { label: 'Done', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  REVIEW_REQUIRED: { label: 'Needs review', tone: 'warning' },
  NOT_STARTED: { label: 'To do', tone: 'neutral' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  SKIPPED: { label: 'Skipped', tone: 'neutral' },
  WAITING_FOR_USER: { label: 'Waiting on you', tone: 'warning' },
  WAITING_FOR_PROVIDER: { label: 'Checking', tone: 'info' },
};

export const APPEAL_STATUS: Record<AppealStatus, string> = {
  OPEN: 'Appeal sent: waiting for review',
  UNDER_REVIEW: 'Your appeal is being reviewed',
  OVERTURNED: 'Appeal successful: the decision has been reopened',
  UPHELD: 'Appeal reviewed: the decision stands',
  CLOSED: 'Appeal closed',
};

/** The check a step belongs to: one form runs several biometric steps at once. */
export type CheckKind = 'identity' | 'phone' | 'biometric' | 'bank' | 'document';

const KIND_OF_STEP: Record<string, CheckKind> = {
  NIN_CHECK: 'identity',
  BVN_CHECK: 'identity',
  PHONE_OTP: 'phone',
  SELFIE_CAPTURE: 'biometric',
  LIVENESS_CHECK: 'biometric',
  FACE_MATCH: 'biometric',
  BANK_ACCOUNT_CHECK: 'bank',
  DOCUMENT_CHECK: 'document',
};

/** The consent each check needs before it may run (the phone code needs none). */
export const CONSENT_FOR: Record<CheckKind, ConsentType | null> = {
  identity: 'ID_CHECK',
  phone: null,
  biometric: 'BIOMETRIC',
  bank: 'BANK_ACCOUNT_CHECK',
  document: 'DOCUMENT_PROCESSING',
};

export const CONSENT_COPY: Record<ConsentType, { title: string; body: string; purpose: string }> = {
  ID_CHECK: {
    title: 'Identity check',
    body: 'We check your number against official records. Other users never see it.',
    purpose: 'Identity verification',
  },
  BIOMETRIC: {
    title: 'Selfie and face check',
    body: 'We take a selfie and run liveness and face-match checks, only for this verification.',
    purpose: 'Biometric verification',
  },
  BANK_ACCOUNT_CHECK: {
    title: 'Bank account check',
    body: 'We confirm the account is yours with a name enquiry. Passing it makes you financially verified (Trust tier 3).',
    purpose: 'Financial verification',
  },
  DOCUMENT_PROCESSING: {
    title: 'Document check',
    body: 'We verify your professional documents, such as an agent licence.',
    purpose: 'Document verification',
  },
};

const ACTIONABLE = ['NOT_STARTED', 'FAILED', 'REVIEW_REQUIRED'];

/** Every check this verification asks for, in the order the policy lists them. */
export function checkKinds(steps: TrustStep[]): CheckKind[] {
  const out: CheckKind[] = [];
  for (const s of steps) {
    const kind = KIND_OF_STEP[s.stepType];
    if (kind && !out.includes(kind)) out.push(kind);
  }
  return out;
}

/** Where a face check (recovery or PIN reset) stands; the server decides. */
export type FaceCheckStatus = 'PENDING' | 'APPROVED' | 'FAILED';

/** What the app needs to run Smile ID's live selfie capture (see trustApi.livenessSession). */
export interface SmileLivenessSession {
  token: string;
  partnerId: string;
  userId: string;
  useSandbox: boolean;
  consent: {
    granted: true;
    grantedAt: string;
    noticeLanguage: string;
    noticePrivacyPolicyUrl: string;
  };
  userDetails: { givenNames: string; lastName: string; email?: string; phoneNumber?: string };
  /** Smile's v3 API for this environment. */
  apiUrl: string;
  callbackUrl?: string;
}

/** One status vocabulary for identity and every requirement (GET /trust/overview). */
export type TrustStatus =
  | 'NOT_STARTED'
  | 'ACTION_REQUIRED'
  | 'IN_PROGRESS'
  | 'PENDING_PROVIDER'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'FAILED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVERIFICATION_REQUIRED'
  | 'UNAVAILABLE';

export type TrustRequirementKey =
  | 'EMAIL'
  | 'PHONE'
  | 'ID_NUMBER'
  | 'LIVE_SELFIE'
  | 'BANK_ACCOUNT'
  | 'PROFESSIONAL_LICENCE'
  | 'BUSINESS_REGISTRATION'
  | 'PROPERTY_OWNERSHIP';

export type TrustPortal =
  | 'renter'
  | 'buyer'
  | 'landlord'
  | 'owner'
  | 'agent'
  | 'realtor'
  | 'manager';

export interface TrustOverview {
  portal: TrustPortal;
  identity: { status: TrustStatus; detail: string; dueBy?: string };
  requirements: {
    key: TrustRequirementKey;
    label: string;
    status: TrustStatus;
    detail: string;
    why: string;
    updatedAt?: string;
    dueBy?: string;
  }[];
  tier: { level: number; label: string };
  /** Null while scoring is switched off: no number is shown in its place. */
  score: {
    total: number;
    penalty: number;
    stage?: { label: string };
    dimensions: { id: string; label: string; earned: number; weight: number }[];
  } | null;
  nextAction: { key: TrustRequirementKey; label: string } | null;
}

export const TRUST_STATUS: Record<TrustStatus, { label: string; tone: BadgeTone }> = {
  VERIFIED: { label: 'Verified', tone: 'success' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  PENDING_PROVIDER: { label: 'Checking', tone: 'info' },
  PENDING_REVIEW: { label: 'In review', tone: 'info' },
  ACTION_REQUIRED: { label: 'Action needed', tone: 'warning' },
  REVERIFICATION_REQUIRED: { label: 'Action needed', tone: 'warning' },
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
  FAILED: { label: 'Did not pass', tone: 'danger' },
  REJECTED: { label: 'Not approved', tone: 'danger' },
  EXPIRED: { label: 'Expired', tone: 'warning' },
  UNAVAILABLE: { label: 'Unavailable', tone: 'neutral' },
};

export type CheckState = 'done' | 'todo' | 'failed' | 'review' | 'waiting';

/**
 * Where one check stands, from its steps: a selfie is one check to the person
 * even though the policy runs capture, liveness and face match as three steps.
 */
export function checkState(steps: TrustStep[], kind: CheckKind): CheckState {
  const own = steps.filter((s) => KIND_OF_STEP[s.stepType] === kind);
  if (own.every((s) => s.status === 'PASSED' || s.status === 'SKIPPED')) return 'done';
  if (own.some((s) => s.status === 'FAILED')) return 'failed';
  if (own.some((s) => s.status === 'REVIEW_REQUIRED')) return 'review';
  if (own.some((s) => s.status === 'WAITING_FOR_PROVIDER' || s.status === 'IN_PROGRESS'))
    return 'waiting';
  return 'todo';
}

/** Checks still to run, in the order the policy lists their first step. */
export function pendingChecks(steps: TrustStep[]): CheckKind[] {
  const out: CheckKind[] = [];
  for (const s of steps) {
    const kind = KIND_OF_STEP[s.stepType];
    if (kind && ACTIONABLE.includes(s.status) && !out.includes(kind)) out.push(kind);
  }
  return out;
}

/** The consent of this type that is still in force, if any. */
export function activeConsent(
  consents: TrustConsent[] | undefined,
  type: ConsentType,
  now: number
): TrustConsent | undefined {
  return (consents ?? []).find(
    (c) =>
      c.consentType === type &&
      !c.revokedAt &&
      (!c.expiresAt || new Date(c.expiresAt).getTime() > now)
  );
}

/** NIN and BVN are 11 digits; other IDs only need something entered. */
export function idNumberOk(type: TrustIdType, value: string): boolean {
  const v = value.trim();
  if (type === 'NIN' || type === 'BVN') return /^\d{11}$/.test(v);
  return v.length >= 4;
}

export const trustApi = {
  /** Identity status, this portal's requirements, tier and score (self-only). */
  overview: (portal: TrustPortal) => apiFetch<TrustOverview>(`/trust/overview?portal=${portal}`),
  /** Starts or resumes the signed-in user's verification (idempotent). */
  start: (subjectId: string, purpose: TrustPurpose) =>
    apiFetch<TrustVerification>('/trust/verifications', {
      method: 'POST',
      body: { subjectType: 'PERSON', subjectId, purpose, country: 'NG' },
    }),
  verification: (id: string) => apiFetch<TrustVerificationDetail>(`/trust/verifications/${id}`),

  consents: () => apiFetch<TrustConsent[]>('/trust/consents'),
  grantConsent: (type: ConsentType) =>
    apiFetch<TrustConsent>('/trust/consents', {
      method: 'POST',
      body: { consentType: type, purpose: CONSENT_COPY[type].purpose, expiresInDays: 365 },
    }),
  revokeConsent: (id: string) =>
    apiFetch<TrustConsent>(`/trust/consents/${id}/revoke`, { method: 'POST' }),

  identity: (
    id: string,
    body: { idType: TrustIdType; idNumber: string; firstName?: string; lastName?: string }
  ) =>
    apiFetch<{ status: string }>(`/trust/verifications/${id}/identity`, {
      method: 'POST',
      body: { ...body, country: 'NG' },
    }),
  sendPhoneCode: (id: string) =>
    apiFetch<{ reference: string }>(`/trust/verifications/${id}/phone-otp/send`, {
      method: 'POST',
    }),
  verifyPhoneCode: (id: string, reference: string, code: string) =>
    apiFetch<TrustVerification>(`/trust/verifications/${id}/phone-otp/verify`, {
      method: 'POST',
      body: { reference, code },
    }),
  /**
   * A Smile ID live selfie session for the liveness step. The token is bound on
   * the server to this user, our webhook and the recorded consent; the result
   * reaches the server from Smile, never from the app.
   */
  livenessSession: (id: string) =>
    apiFetch<SmileLivenessSession>(`/trust/verifications/${id}/liveness/session`, {
      method: 'POST',
    }),
  biometrics: (id: string, selfie: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'selfie', selfie);
    return apiUpload<TrustVerification>(`/trust/verifications/${id}/biometrics`, form);
  },
  bank: (id: string, body: { accountNumber: string; accountName?: string; bankCode?: string }) =>
    apiFetch<{ status: string }>(`/trust/verifications/${id}/bank`, {
      method: 'POST',
      body: { ...body, country: 'NG' },
    }),
  document: (
    id: string,
    body: { documentType: string; documentNumber: string; holderName?: string }
  ) =>
    apiFetch<{ status: string }>(`/trust/verifications/${id}/document`, {
      method: 'POST',
      body: { ...body, country: 'NG' },
    }),

  myAppeals: () => apiFetch<TrustAppeal[]>('/trust/appeals/mine'),
  appeal: (verificationId: string, reason: string) =>
    apiFetch<TrustAppeal>('/trust/appeals', {
      method: 'POST',
      body: { targetType: 'TRUST_VERIFICATION', targetId: verificationId, reason },
    }),
};
