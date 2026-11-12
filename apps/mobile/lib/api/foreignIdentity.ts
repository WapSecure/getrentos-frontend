import type { ForeignSubmission } from '@sureground/shared';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { SmileLivenessSession } from './trust';

// Identity checks abroad for Diaspora Invest (decision D3), the same routes as web's
// foreignIdentityService. The status itself is `investorApi.identityAbroad`.

export interface PassportSession extends SmileLivenessSession {
  automatedAttemptsUsed: number;
  freeAutomatedAttempts: number;
}

export type ForeignDocumentKind = 'address-proof' | 'bank-statement';

export const foreignIdentityApi = {
  /** 409 AUTOMATED_ATTEMPT_USED after the free check; 503 PASSPORT_CHECK_UNAVAILABLE when Smile ID is off. */
  startPassportSession: (issuingCountry: string) =>
    apiFetch<PassportSession>('/trust/foreign-identity/passport/session', {
      method: 'POST',
      body: { issuingCountry },
    }),
  /** For a late webhook: can only ever send the check to staff, never pass it. */
  checkPassport: (jobId: string) =>
    apiFetch<{ status: 'pending' | 'applied' | 'settled' }>(
      '/trust/foreign-identity/passport/check',
      { method: 'POST', body: { jobId } }
    ),
  submitPassportForReview: (passport: PickedFile, selfie: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'passport', passport);
    appendFile(form, 'selfie', selfie);
    return apiUpload<ForeignSubmission>('/trust/foreign-identity/passport/review', form);
  },
  submitDocument: (kind: ForeignDocumentKind, document: PickedFile, note?: string) => {
    const form = new FormData();
    appendFile(form, 'document', document);
    if (note) form.append('note', note);
    return apiUpload<ForeignSubmission>(`/trust/foreign-identity/${kind}`, form);
  },
};
