import { authFetch, safeCall } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type {
  StaffPasskey,
  StaffSession,
  TwoFactorEnrollment,
  TwoFactorStatus,
} from '@/types/admin';

/**
 * The signed-in staff member's own sign-in factors (backend /users/me/security).
 * Every change asks the person to confirm it's them first; authFetch prompts
 * through the StepUpDialog and replays, so callers never see that refusal.
 */
export const accountSecurityService = {
  async getTwoFactorStatus(): Promise<ApiResponse<TwoFactorStatus>> {
    return safeCall(() => authFetch<TwoFactorStatus>('/users/me/security/2fa'));
  },

  /** A new secret; allowed again while two-factor is not yet turned on. */
  async enrollTwoFactor(): Promise<ApiResponse<TwoFactorEnrollment>> {
    return safeCall(() =>
      authFetch<TwoFactorEnrollment>('/users/me/security/2fa/enroll', { method: 'POST' })
    );
  },

  /** Turns two-factor on; the backup codes come back this once only. */
  async enableTwoFactor(
    token: string
  ): Promise<ApiResponse<{ enabled: boolean; recoveryCodes: string[] }>> {
    return safeCall(() =>
      authFetch<{ enabled: boolean; recoveryCodes: string[] }>('/users/me/security/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  },

  async disableTwoFactor(token: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return safeCall(() =>
      authFetch<{ enabled: boolean }>('/users/me/security/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  },

  async listPasskeys(): Promise<ApiResponse<{ hasPasskey: boolean; passkeys: StaffPasskey[] }>> {
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

  /** New backup codes; the old ones stop working (asks the person to confirm it's them). */
  async regenerateRecoveryCodes(): Promise<ApiResponse<{ recoveryCodes: string[] }>> {
    return safeCall(() =>
      authFetch<{ recoveryCodes: string[] }>('/users/me/security/2fa/recovery-codes', {
        method: 'POST',
      })
    );
  },

  async listSessions(): Promise<ApiResponse<StaffSession[]>> {
    return safeCall(() => authFetch<StaffSession[]>('/users/me/security/sessions'));
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
