import type { SmileLivenessSession } from '@/services/trustService';

/** Mirrors getrentos-backend src/modules/trust/foreign-identity (decision D3); shared with mobile. */
export type {
  ForeignCheckState,
  ForeignDocumentStatus,
  ForeignIdentityStatus,
  ForeignIneligibleReason,
  ForeignSubmission,
} from '@sureground/shared';

export interface PassportSession extends SmileLivenessSession {
  automatedAttemptsUsed: number;
  freeAutomatedAttempts: number;
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
