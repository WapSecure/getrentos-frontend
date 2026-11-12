import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type {
  ForeignIdentityStatus,
  ForeignSubmission,
  PassportSession,
  SourceOfFundsSupportingKind,
} from '@/types/foreignIdentity';

/** Diaspora investors only; every route acts on the signed-in user. */
export const foreignIdentityService = {
  getStatus(): Promise<ApiResponse<ForeignIdentityStatus>> {
    return safeCall(() => authFetch<ForeignIdentityStatus>('/trust/foreign-identity'));
  },

  /** 409 AUTOMATED_ATTEMPT_USED after the free check; 503 PASSPORT_CHECK_UNAVAILABLE when Smile ID is off. */
  startPassportSession(issuingCountry: string): Promise<ApiResponse<PassportSession>> {
    return safeCall(() =>
      authFetch<PassportSession>('/trust/foreign-identity/passport/session', {
        method: 'POST',
        body: JSON.stringify({ issuingCountry }),
      })
    );
  },

  /** For a late webhook: can only ever send the check to staff, never pass it. */
  checkPassport(
    jobId: string
  ): Promise<ApiResponse<{ status: 'pending' | 'applied' | 'settled' }>> {
    return safeCall(() =>
      authFetch<{ status: 'pending' | 'applied' | 'settled' }>(
        '/trust/foreign-identity/passport/check',
        { method: 'POST', body: JSON.stringify({ jobId }) }
      )
    );
  },

  submitPassportForReview(params: {
    passport: File;
    selfie: File;
  }): Promise<ApiResponse<ForeignSubmission>> {
    return safeCall(() => {
      const form = new FormData();
      form.append('passport', params.passport);
      form.append('selfie', params.selfie);
      return authFetch<ForeignSubmission>('/trust/foreign-identity/passport/review', {
        method: 'POST',
        body: form,
      });
    });
  },

  submitAddressProof(document: File, note?: string): Promise<ApiResponse<ForeignSubmission>> {
    return foreignIdentityService.submitDocument('address-proof', document, note);
  },

  submitBankStatement(document: File, note?: string): Promise<ApiResponse<ForeignSubmission>> {
    return foreignIdentityService.submitDocument('bank-statement', document, note);
  },

  /** DIA-07: six months of statements, one or more supporting documents, and the donor's ID with a gift letter. */
  submitSourceOfFunds(params: {
    bankStatements: File[];
    supportingKind: SourceOfFundsSupportingKind;
    supporting: File[];
    donorIdentity?: File | null;
    note?: string;
  }): Promise<ApiResponse<ForeignSubmission>> {
    return safeCall(() => {
      const form = new FormData();
      params.bankStatements.forEach((file) => form.append('bankStatements', file));
      params.supporting.forEach((file) => form.append('supporting', file));
      if (params.donorIdentity) form.append('donorIdentity', params.donorIdentity);
      form.append('supportingKind', params.supportingKind);
      if (params.note) form.append('note', params.note);
      return authFetch<ForeignSubmission>('/trust/foreign-identity/source-of-funds', {
        method: 'POST',
        body: form,
      });
    });
  },

  submitDocument(
    path: 'address-proof' | 'bank-statement',
    document: File,
    note?: string
  ): Promise<ApiResponse<ForeignSubmission>> {
    return safeCall(() => {
      const form = new FormData();
      form.append('document', document);
      if (note) form.append('note', note);
      return authFetch<ForeignSubmission>(`/trust/foreign-identity/${path}`, {
        method: 'POST',
        body: form,
      });
    });
  },
};
