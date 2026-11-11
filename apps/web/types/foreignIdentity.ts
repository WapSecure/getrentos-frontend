import type { SmileLivenessSession } from '@/services/trustService';

/** Mirrors getrentos-backend src/modules/trust/foreign-identity (decision D3). */
export type ForeignCheckState = 'NOT_STARTED' | 'CHECKING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type ForeignIneligibleReason = 'NO_INVESTOR_PROFILE' | 'NATIONALITY_NOT_YET_SUPPORTED';

export interface ForeignDocumentStatus {
  state: ForeignCheckState;
  /** End of the 2nd Lagos working day after the upload, while staff have it. */
  reviewDueAt: string | null;
}

export interface ForeignIdentityStatus {
  eligible: boolean;
  ineligibleReason?: ForeignIneligibleReason | string;
  passport: ForeignDocumentStatus & {
    automatedAttemptsUsed: number;
    freeAutomatedAttempts: number;
    /** The automatic Smile ID check, or an upload a person reviews. */
    nextAttempt: 'AUTOMATED' | 'STAFF_REVIEW';
    automatedCheckAvailable: boolean;
    sandbox: boolean;
  };
  address: ForeignDocumentStatus;
  bankStatement: ForeignDocumentStatus;
}

export interface PassportSession extends SmileLivenessSession {
  automatedAttemptsUsed: number;
  freeAutomatedAttempts: number;
}

export interface ForeignSubmission {
  verificationId: string;
  state: ForeignCheckState;
  reviewCaseId: string | null;
  reviewDueAt: string | null;
}

/** Error codes the foreign identity endpoints answer with (body `error`). */
export type ForeignIdentityErrorCode =
  | 'FOREIGN_IDENTITY_NOT_ELIGIBLE'
  | 'AUTOMATED_ATTEMPT_USED'
  | 'AUTOMATED_ATTEMPT_AVAILABLE'
  | 'PASSPORT_CHECK_UNAVAILABLE'
  | 'PASSPORT_VERIFIED'
  | 'ALREADY_APPROVED'
  | 'IN_REVIEW';
