import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type {
  AccountSession,
  PayoutHold,
  RecentSignIn,
  Passkey,
  SecurityOverview,
  SetTransactionPinInput,
  TwoFactorEnrollment,
  TwoFactorStatus,
} from '@/types/accountSecurity';

/** Step-up confirmations are prompted by StepUpDialog and replayed by authFetch. */
export const accountSecurityService = {
  async getOverview(): Promise<ApiResponse<SecurityOverview>> {
    return safeCall(() => authFetch('/users/me/security'));
  },

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      authFetch('/users/me/security/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
    );
  },

  async getTwoFactorStatus(): Promise<ApiResponse<TwoFactorStatus>> {
    return safeCall(() => authFetch('/users/me/security/2fa'));
  },

  async enrollTwoFactor(): Promise<ApiResponse<TwoFactorEnrollment>> {
    return safeCall(() => authFetch('/users/me/security/2fa/enroll', { method: 'POST' }));
  },

  /** The backup codes are shown only this once. */
  async enableTwoFactor(
    token: string
  ): Promise<ApiResponse<{ enabled: boolean; recoveryCodes: string[] }>> {
    return safeCall(() =>
      authFetch('/users/me/security/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  },

  async disableTwoFactor(token: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return safeCall(() =>
      authFetch('/users/me/security/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  },

  /** The old codes stop working; needs step-up confirmation. */
  async regenerateRecoveryCodes(): Promise<ApiResponse<{ recoveryCodes: string[] }>> {
    return safeCall(() => authFetch('/users/me/security/2fa/recovery-codes', { method: 'POST' }));
  },

  /**
   * Changing takes the current password and PIN; a first or forgotten PIN takes the password and an
   * emailed code. Accounts with no password leave it out.
   */
  async setTransactionPin(
    input: SetTransactionPinInput
  ): Promise<ApiResponse<{ hasTransactionPin: true }>> {
    return safeCall(() =>
      authFetch('/users/me/security/transaction-pin', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  async sendSecurityCode(): Promise<ApiResponse<{ reference: string; sentTo: string }>> {
    return safeCall(() => authFetch('/users/me/security/step-up/code', { method: 'POST' }));
  },

  async listPasskeys(): Promise<ApiResponse<{ hasPasskey: boolean; passkeys: Passkey[] }>> {
    return safeCall(() => authFetch('/users/me/security/passkey'));
  },

  async startPasskeyRegistration(): Promise<ApiResponse<Record<string, unknown>>> {
    return safeCall(() =>
      authFetch('/users/me/security/passkey/register/options', { method: 'POST' })
    );
  },

  async finishPasskeyRegistration(
    response: unknown,
    deviceName?: string
  ): Promise<ApiResponse<{ hasPasskey: true }>> {
    return safeCall(() =>
      authFetch('/users/me/security/passkey/register/verify', {
        method: 'POST',
        body: JSON.stringify({ response, deviceName }),
      })
    );
  },

  async removePasskey(id: string): Promise<ApiResponse<{ removed: true }>> {
    return safeCall(() => authFetch(`/users/me/security/passkey/${id}`, { method: 'DELETE' }));
  },

  async listRecentSignIns(): Promise<ApiResponse<RecentSignIn[]>> {
    return safeCall(() => authFetch('/users/me/security/sign-ins'));
  },

  async listPayoutHolds(): Promise<ApiResponse<PayoutHold[]>> {
    return safeCall(() => authFetch('/users/me/security/payout-holds'));
  },

  async appealPayoutHold(id: string, note: string): Promise<ApiResponse<{ appealed: true }>> {
    return safeCall(() =>
      authFetch(`/users/me/security/payout-holds/${id}/appeal`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    );
  },

  async listSessions(): Promise<ApiResponse<AccountSession[]>> {
    return safeCall(() => authFetch('/users/me/security/sessions'));
  },

  /** That device is signed out at its next refresh (within 15 minutes). */
  async signOutSession(id: string): Promise<ApiResponse<{ revoked: true }>> {
    return safeCall(() => authFetch(`/users/me/security/sessions/${id}`, { method: 'DELETE' }));
  },

  /** Needs step-up confirmation. */
  async signOutOtherSessions(): Promise<ApiResponse<{ revoked: number }>> {
    return safeCall(() =>
      authFetch('/users/me/security/sessions/sign-out-others', { method: 'POST' })
    );
  },
};
