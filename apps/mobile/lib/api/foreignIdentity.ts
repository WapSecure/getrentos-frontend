import {
  sourceOfFundsHoldMessage,
  type ForeignSubmission,
  type SourceOfFundsCheck,
  type SourceOfFundsSupportingKind,
} from '@sureground/shared';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { SmileLivenessSession } from './trust';

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
  checkSourceOfFunds: (amount: number) =>
    apiFetch<SourceOfFundsCheck>(
      `/trust/foreign-identity/source-of-funds/check?amount=${Math.round(amount)}`
    ),
  /** The line to show instead of sending an offer or deposit that would be refused. Fails open: the API still enforces it. */
  sourceOfFundsHold: async (amount: number): Promise<string | null> => {
    if (!(amount > 0)) return null;
    try {
      return sourceOfFundsHoldMessage(await foreignIdentityApi.checkSourceOfFunds(amount));
    } catch {
      return null;
    }
  },
  submitSourceOfFunds: (input: {
    bankStatement: PickedFile;
    supportingKind: SourceOfFundsSupportingKind;
    supporting: PickedFile;
    donorIdentity?: PickedFile | null;
    note?: string;
  }) => {
    const form = new FormData();
    appendFile(form, 'bankStatements', input.bankStatement);
    appendFile(form, 'supporting', input.supporting);
    if (input.donorIdentity) appendFile(form, 'donorIdentity', input.donorIdentity);
    form.append('supportingKind', input.supportingKind);
    if (input.note) form.append('note', input.note);
    return apiUpload<ForeignSubmission>('/trust/foreign-identity/source-of-funds', form);
  },
  submitDocument: (kind: ForeignDocumentKind, document: PickedFile, note?: string) => {
    const form = new FormData();
    appendFile(form, 'document', document);
    if (note) form.append('note', note);
    return apiUpload<ForeignSubmission>(`/trust/foreign-identity/${kind}`, form);
  },
};
