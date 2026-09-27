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
  twoFactor: TwoFactorStatus;
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
};
