import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type {
  AccountSession,
  Passkey,
  SecurityOverview,
  SetTransactionPinInput,
  TwoFactorEnrollment,
  TwoFactorStatus,
} from '@/types/accountSecurity';

/**
 * The signed-in person's own security (backend /users/me/security), the same
 * for every role. Changes that need the person to confirm it's them are
 * prompted by the StepUpDialog and replayed by authFetch.
 */
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

  // ---- Authenticator app ----
  async getTwoFactorStatus(): Promise<ApiResponse<TwoFactorStatus>> {
    return safeCall(() => authFetch('/users/me/security/2fa'));
  },

  async enrollTwoFactor(): Promise<ApiResponse<TwoFactorEnrollment>> {
    return safeCall(() => authFetch('/users/me/security/2fa/enroll', { method: 'POST' }));
  },

  async enableTwoFactor(token: string): Promise<ApiResponse<{ enabled: boolean }>> {
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

  // ---- Transaction PIN ----
  /**
   * Set, change or reset the 6-digit PIN. Changing one takes the current
   * password and PIN; a first or forgotten PIN takes the password and an
   * emailed code (`sendSecurityCode`). Accounts with no password leave it out.
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

  /** Emails a 6-digit code that proves it's the account holder (e.g. to reset a PIN). */
  async sendSecurityCode(): Promise<ApiResponse<{ reference: string; sentTo: string }>> {
    return safeCall(() => authFetch('/users/me/security/step-up/code', { method: 'POST' }));
  },

  // ---- Passkeys (WebAuthn) ----
  async listPasskeys(): Promise<ApiResponse<{ hasPasskey: boolean; passkeys: Passkey[] }>> {
    return safeCall(() => authFetch('/users/me/security/passkey'));
  },

  /** WebAuthn creation options to pass to the browser's startRegistration(). */
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

  // ---- Where you're signed in ----
  async listSessions(): Promise<ApiResponse<AccountSession[]>> {
    return safeCall(() => authFetch('/users/me/security/sessions'));
  },

  /** That device is signed out at its next refresh (within 15 minutes). */
  async signOutSession(id: string): Promise<ApiResponse<{ revoked: true }>> {
    return safeCall(() => authFetch(`/users/me/security/sessions/${id}`, { method: 'DELETE' }));
  },

  /** Keeps this device; needs the person to confirm it's them. */
  async signOutOtherSessions(): Promise<ApiResponse<{ revoked: number }>> {
    return safeCall(() =>
      authFetch('/users/me/security/sessions/sign-out-others', { method: 'POST' })
    );
  },
};
