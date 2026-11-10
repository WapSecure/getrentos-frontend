import type { FaceCheckStatus, SmileLivenessSession } from './trust';
import { apiFetch } from './client';

export interface TwoFactorStatus {
  enrolled: boolean;
  enabled: boolean;
  /** Unused one-time backup codes (0 while two-factor is off). */
  recoveryCodesLeft?: number;
}

export interface TwoFactorEnrollment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export interface SecurityOverview {
  phone: string | null;
  phoneVerified: boolean;
  /** False for accounts that only ever signed in with Google or Apple. */
  hasPassword: boolean;
  hasTransactionPin: boolean;
  hasPasskey: boolean;
  twoFactor: TwoFactorStatus;
  stepUpMethod: StepUpMethod;
}

/**
 * A password alone never confirms anything: an account with no factor gets
 * `setup_required` and must add a PIN or a passkey first.
 */
export type StepUpMethod = 'passkey' | 'totp' | 'transaction_pin' | 'setup_required';

export interface SetTransactionPinInput {
  currentPassword?: string;
  pin: string;
  currentPin?: string;
  reference?: string;
  code?: string;
  faceCheckId?: string;
}

export interface PasskeySummary {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AccountSession {
  id: string;
  device: string;
  ipAddress?: string;
  lastActiveAt: string;
  current: boolean;
}

export const securityApi = {
  overview: () => apiFetch<SecurityOverview>('/users/me/security'),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/users/me/security/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    }),

  deactivate: (password: string) =>
    apiFetch<{ message: string }>('/users/me/security/deactivate', {
      method: 'POST',
      body: { password },
    }),

  sendPhoneVerification: () =>
    apiFetch<{ reference: string }>('/users/me/security/phone/verify/send', { method: 'POST' }),

  confirmPhoneVerification: (reference: string, otp: string) =>
    apiFetch<{ phoneVerified: boolean }>('/users/me/security/phone/verify', {
      method: 'POST',
      body: { reference, otp },
    }),

  enrollTwoFactor: () =>
    apiFetch<TwoFactorEnrollment>('/users/me/security/2fa/enroll', { method: 'POST' }),

  /** The backup codes come back this once only. */
  enableTwoFactor: (token: string) =>
    apiFetch<{ enabled: boolean; recoveryCodes: string[] }>('/users/me/security/2fa/enable', {
      method: 'POST',
      body: { token },
    }),

  /** The old codes stop working. Behind step-up, which apiFetch prompts for. */
  regenerateRecoveryCodes: () =>
    apiFetch<{ recoveryCodes: string[] }>('/users/me/security/2fa/recovery-codes', {
      method: 'POST',
    }),

  /** Takes an authenticator code or a backup code. */
  disableTwoFactor: (token: string) =>
    apiFetch<{ enabled: boolean }>('/users/me/security/2fa/disable', {
      method: 'POST',
      body: { token },
    }),

  sendStepUpCode: () =>
    apiFetch<{ reference: string; sentTo: string }>('/users/me/security/step-up/code', {
      method: 'POST',
    }),

  confirmStepUp: (input: {
    password?: string;
    pin?: string;
    code?: string;
    reference?: string;
    passkeyResponse?: unknown;
    /** Binds the token to the request that asked for it. */
    challengeId?: string;
  }) =>
    apiFetch<{ stepUpToken: string; expiresIn: number }>('/users/me/security/step-up', {
      method: 'POST',
      body: input,
    }),

  /** Changing a PIN takes the current password and PIN; a first or forgotten one takes the password and an emailed code. Accounts with no password leave it out. */
  startPinFaceCheck: () =>
    apiFetch<{ faceCheckId: string; session: SmileLivenessSession }>(
      '/users/me/security/transaction-pin/face',
      { method: 'POST' }
    ),
  pinFaceCheckStatus: (faceCheckId: string) =>
    apiFetch<{ status: FaceCheckStatus }>('/users/me/security/transaction-pin/face/status', {
      method: 'POST',
      body: { faceCheckId },
    }),
  setTransactionPin: (input: SetTransactionPinInput) =>
    apiFetch<{ hasTransactionPin: true }>('/users/me/security/transaction-pin', {
      method: 'POST',
      body: input,
    }),

  listPasskeys: () =>
    apiFetch<{ hasPasskey: boolean; passkeys: PasskeySummary[] }>('/users/me/security/passkey'),

  /** WebAuthn creation options to hand to Passkey.create(). */
  startPasskeyRegistration: () =>
    apiFetch<Record<string, unknown>>('/users/me/security/passkey/register/options', {
      method: 'POST',
    }),

  finishPasskeyRegistration: (response: unknown, deviceName?: string) =>
    apiFetch<{ hasPasskey: true }>('/users/me/security/passkey/register/verify', {
      method: 'POST',
      body: { response, deviceName },
    }),

  removePasskey: (id: string) =>
    apiFetch<{ removed: true }>(`/users/me/security/passkey/${id}`, { method: 'DELETE' }),

  listSessions: () => apiFetch<AccountSession[]>('/users/me/security/sessions'),

  listRecentSignIns: () =>
    apiFetch<{ id: string; at: string; device: string; newDevice: boolean }[]>(
      '/users/me/security/sign-ins'
    ),

  listPayoutHolds: () =>
    apiFetch<
      {
        id: string;
        createdAt: string;
        signals: { rule: string; outcome: string; reason: string }[];
        appealNote: string | null;
        appealedAt: string | null;
      }[]
    >('/users/me/security/payout-holds'),

  appealPayoutHold: (id: string, note: string) =>
    apiFetch<{ appealed: true }>(`/users/me/security/payout-holds/${id}/appeal`, {
      method: 'POST',
      body: { note },
    }),

  /** That device is signed out at its next refresh (within 15 minutes). */
  signOutSession: (id: string) =>
    apiFetch<{ revoked: true }>(`/users/me/security/sessions/${id}`, { method: 'DELETE' }),

  /** Keeps this phone; behind step-up, which apiFetch prompts for. */
  signOutOtherSessions: () =>
    apiFetch<{ revoked: number }>('/users/me/security/sessions/sign-out-others', {
      method: 'POST',
    }),

  /** WebAuthn request options (the step-up challenge) to hand to Passkey.get(). */
  startPasskeyStepUp: () =>
    apiFetch<Record<string, unknown>>('/users/me/security/step-up/passkey/options', {
      method: 'POST',
    }),

  /** Behind step-up: the API asks for confirmation first, handled by apiFetch. */
  startEmailChange: (newEmail: string) =>
    apiFetch<{ reference: string; sentTo: string }>('/users/me/security/email', {
      method: 'POST',
      body: { newEmail },
    }),

  confirmEmailChange: (reference: string, otp: string) =>
    apiFetch<{ email: string }>('/users/me/security/email/confirm', {
      method: 'POST',
      body: { reference, otp },
    }),

  /** A number already on the account changes only after the new one proves itself with a code. */
  startPhoneChange: (newPhone: string) =>
    apiFetch<{ reference: string; sentTo: string }>('/users/me/security/phone', {
      method: 'POST',
      body: { newPhone },
    }),

  confirmPhoneChange: (reference: string, otp: string) =>
    apiFetch<{ phone: string; phoneVerified: true }>('/users/me/security/phone/confirm', {
      method: 'POST',
      body: { reference, otp },
    }),
};
