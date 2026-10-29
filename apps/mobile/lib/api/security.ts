import { apiFetch } from './client';

export interface TwoFactorStatus {
  enrolled: boolean;
  enabled: boolean;
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
  /** Whether a transaction PIN (a separate secret from the password) is set. */
  hasTransactionPin: boolean;
  /** Whether a passkey (the strongest factor) is registered. */
  hasPasskey: boolean;
  twoFactor: TwoFactorStatus;
  /** How this account confirms sensitive changes: its strongest factor. */
  stepUpMethod: StepUpMethod;
}

export type StepUpMethod = 'passkey' | 'totp' | 'transaction_pin' | 'password' | 'email_code';

export interface PasskeySummary {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Account security for every role — the person's, not a portal's. */
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

  enableTwoFactor: (token: string) =>
    apiFetch<{ enabled: boolean }>('/users/me/security/2fa/enable', {
      method: 'POST',
      body: { token },
    }),

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
  }) =>
    apiFetch<{ stepUpToken: string; expiresIn: number }>('/users/me/security/step-up', {
      method: 'POST',
      body: input,
    }),

  /** Set or change the transaction PIN, confirmed with the current password. */
  setTransactionPin: (currentPassword: string, pin: string) =>
    apiFetch<{ hasTransactionPin: true }>('/users/me/security/transaction-pin', {
      method: 'POST',
      body: { currentPassword, pin },
    }),

  // ---- Passkeys (WebAuthn) ----
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
};
