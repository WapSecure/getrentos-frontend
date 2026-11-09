import { apiFetch, CLIENT_APP } from './apiClient';
import { getInstallId } from './installId';
import { safeCall } from './apiHelpers';
import type { ApiResponse } from './apiHelpers';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  legalName: string;
  isVerified: boolean;
  // Backend RoleType values, e.g. "PROPERTY_OWNER".
  roles: string[];
  trustScore: number;
}

export interface AuthResult extends AuthUser {
  accessToken: string;
  // Delivered via httpOnly cookie.
  refreshToken?: string;
  expiresIn: number;
}

export interface TwoFactorChallenge extends AuthUser {
  requiresTwoFactor: true;
  challengeToken: string;
  expiresIn: number;
}

export type LoginResult = AuthResult | TwoFactorChallenge;

type OtpPurpose = 'signup' | 'password_reset';

const installIdHeader = (): Record<string, string> => {
  const id = getInstallId();
  return id ? { 'x-device-id': id } : {};
};

export const authService = {
  async sendOtp(
    identifier: string,
    method: 'email' | 'phone' | 'whatsapp',
    purpose: OtpPurpose = 'signup'
  ): Promise<ApiResponse<{ reference: string }>> {
    return safeCall(() =>
      apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ identifier, method, purpose }),
      })
    );
  },

  async verifyOtp(otp: string, reference: string): Promise<ApiResponse<{ verified: boolean }>> {
    return safeCall(() =>
      apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ reference, otp }),
      })
    );
  },

  async resendOtp(reference: string): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      apiFetch('/auth/otp/resend', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      })
    );
  },

  async createAccount(data: {
    email?: string;
    phone?: string;
    fullName: string;
    password: string;
    method: 'email' | 'phone';
    selectedRoles: string[];
    reference: string;
    referralCode?: string;
  }): Promise<ApiResponse<AuthResult>> {
    return safeCall(() =>
      apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: installIdHeader(),
      })
    );
  },

  async login(
    identifier: string,
    password: string,
    rememberMe = false,
    // Lets the API reject non-staff accounts before issuing a token; defaults to this app's id so
    // the header and the refresh cookie cannot disagree.
    clientApp?: string
  ): Promise<ApiResponse<LoginResult>> {
    const app = clientApp ?? CLIENT_APP;
    return safeCall(() =>
      apiFetch<LoginResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, rememberMe }),
        headers: app ? { 'x-client-app': app } : undefined,
      })
    );
  },

  async completeTwoFactorLogin(
    challengeToken: string,
    token: string,
    clientApp?: string
  ): Promise<ApiResponse<AuthResult>> {
    const app = clientApp ?? CLIENT_APP;
    return safeCall(() =>
      apiFetch<AuthResult>('/auth/login/2fa', {
        method: 'POST',
        body: JSON.stringify({ challengeToken, token }),
        headers: app ? { 'x-client-app': app } : undefined,
      })
    );
  },

  oauthUrl(provider: string): string {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/oauth/${provider}`;
  },

  async sendMagicLink(
    email: string,
    redirectTo?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      apiFetch('/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email, redirectTo }),
      })
    );
  },

  async verifyMagicLink(token: string): Promise<ApiResponse<LoginResult>> {
    return safeCall(() =>
      apiFetch('/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  },

  async resetPassword(
    reference: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      apiFetch('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ reference, newPassword }),
      })
    );
  },
};
