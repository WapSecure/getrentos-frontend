import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';

export interface RenterProfile {
  fullName: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  avatarUrl?: string;
  location?: string;
  bio?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export interface TwoFactorStatus {
  enrolled: boolean;
  enabled: boolean;
}

export interface TwoFactorEnrollment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export const profileApi = {
  get: () => apiFetch<RenterProfile>('/renter/profile'),

  update: (input: UpdateProfileInput) =>
    apiFetch<RenterProfile>('/renter/profile', { method: 'PUT', body: input }),

  uploadAvatar: (file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<RenterProfile>('/renter/profile/avatar', form);
  },

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/renter/settings/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    }),

  deleteAccount: (password: string) =>
    apiFetch<{ message: string }>('/renter/settings/account', {
      method: 'DELETE',
      body: { password },
    }),

  sendPhoneVerification: () =>
    apiFetch<{ reference: string }>('/renter/settings/phone/verify/send', { method: 'POST' }),

  confirmPhoneVerification: (reference: string, otp: string) =>
    apiFetch<{ phoneVerified: boolean }>('/renter/settings/phone/verify', {
      method: 'POST',
      body: { reference, otp },
    }),

  getTwoFactorStatus: () => apiFetch<TwoFactorStatus>('/renter/settings/2fa'),

  enrollTwoFactor: () =>
    apiFetch<TwoFactorEnrollment>('/renter/settings/2fa/enroll', { method: 'POST' }),

  enableTwoFactor: (token: string) =>
    apiFetch<{ enabled: boolean }>('/renter/settings/2fa/enable', {
      method: 'POST',
      body: { token },
    }),

  disableTwoFactor: (token: string) =>
    apiFetch<{ enabled: boolean }>('/renter/settings/2fa/disable', {
      method: 'POST',
      body: { token },
    }),
};
