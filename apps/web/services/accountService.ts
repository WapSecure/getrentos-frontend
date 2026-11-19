import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export interface AccountProfile {
  fullName: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  avatarUrl?: string;
  location?: string;
  bio?: string;
}

export interface AccountNotificationPreference {
  id: string;
  category: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

/** Profile, notification and deletion settings are per person, so these work in every portal. */
export const accountService = {
  getProfile(): Promise<ApiResponse<AccountProfile>> {
    return safeCall(() => authFetch('/users/me/profile'));
  },

  updateProfile(data: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }): Promise<ApiResponse<AccountProfile>> {
    return safeCall(() =>
      authFetch('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) })
    );
  },

  updateAvatar(file: File): Promise<ApiResponse<AccountProfile>> {
    const formData = new FormData();
    formData.append('file', file);
    return safeCall(() =>
      authFetch('/users/me/profile/avatar', { method: 'POST', body: formData })
    );
  },

  sendPhoneVerification(): Promise<ApiResponse<{ reference: string }>> {
    return safeCall(() => authFetch('/users/me/security/phone/verify/send', { method: 'POST' }));
  },

  confirmPhoneVerification(
    reference: string,
    otp: string
  ): Promise<ApiResponse<{ phoneVerified: boolean }>> {
    return safeCall(() =>
      authFetch('/users/me/security/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ reference, otp }),
      })
    );
  },

  listNotificationPreferences(): Promise<ApiResponse<AccountNotificationPreference[]>> {
    return safeCall(() => authFetch('/users/me/notification-preferences'));
  },

  updateNotificationPreference(
    category: string,
    data: { email?: boolean; push?: boolean; inApp?: boolean }
  ): Promise<ApiResponse<AccountNotificationPreference>> {
    return safeCall(() =>
      authFetch(`/users/me/notification-preferences/${encodeURIComponent(category)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      authFetch('/users/me/security/deactivate', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
    );
  },
};
