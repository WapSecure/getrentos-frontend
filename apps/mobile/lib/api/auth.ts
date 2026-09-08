import { apiFetch } from './client';
import { env } from '../env';

export type BackendRole = string;
export type OtpMethod = 'email' | 'phone' | 'whatsapp';
export type OtpPurpose = 'signup' | 'password_reset';

export interface AuthProfile {
  id: string;
  email?: string;
  phone?: string;
  legalName: string;
  isVerified: boolean;
  roles: BackendRole[];
  trustScore: number;
}

export interface AuthSession extends AuthProfile {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TwoFactorChallenge extends AuthProfile {
  requiresTwoFactor: true;
  challengeToken: string;
  expiresIn: number;
}

export type LoginResult = AuthSession | TwoFactorChallenge;

export const isTwoFactorChallenge = (r: LoginResult): r is TwoFactorChallenge =>
  'requiresTwoFactor' in r && r.requiresTwoFactor === true;

export const authApi = {
  // ---- password sign-in ----------------------------------------------------
  login: (identifier: string, password: string) =>
    apiFetch<LoginResult>('/auth/login', {
      method: 'POST',
      anonymous: true,
      body: { identifier, password },
    }),

  completeTwoFactor: (challengeToken: string, token: string) =>
    apiFetch<AuthSession>('/auth/login/2fa', {
      method: 'POST',
      anonymous: true,
      body: { challengeToken, token },
    }),

  // ---- session ----------------------------------------------------------
  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken?: string }>('/auth/refresh', {
      method: 'POST',
      anonymous: true,
      body: { refreshToken },
    }),

  logout: (refreshToken: string) =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      anonymous: true,
      body: { refreshToken },
    }),

  me: () => apiFetch<AuthProfile>('/auth/me'),

  // ---- one-time codes (signup + password reset) --------------------------
  sendOtp: (identifier: string, method: OtpMethod, purpose: OtpPurpose) =>
    apiFetch<{ reference: string }>('/auth/otp/send', {
      method: 'POST',
      anonymous: true,
      body: { identifier, method, purpose },
    }),

  verifyOtp: (reference: string, otp: string) =>
    apiFetch<{ verified: boolean }>('/auth/otp/verify', {
      method: 'POST',
      anonymous: true,
      body: { reference, otp },
    }),

  resendOtp: (reference: string) =>
    apiFetch<{ message: string }>('/auth/otp/resend', {
      method: 'POST',
      anonymous: true,
      body: { reference },
    }),

  // ---- account creation ------------------------------------------------
  signup: (input: {
    email?: string;
    phone?: string;
    fullName: string;
    password: string;
    method: 'email' | 'phone';
    selectedRoles: string[];
    reference: string;
    referralCode?: string;
  }) =>
    apiFetch<AuthSession>('/auth/signup', {
      method: 'POST',
      anonymous: true,
      body: input,
    }),

  // ---- password reset -------------------------------------------------
  resetPassword: (reference: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/password/reset', {
      method: 'POST',
      anonymous: true,
      body: { reference, newPassword },
    }),

  // ---- magic link -------------------------------------------------------
  sendMagicLink: (email: string) =>
    apiFetch<{ message: string }>('/auth/magic-link/send', {
      method: 'POST',
      anonymous: true,
      body: { email, redirectTo: `${env.clientApp === 'mobile' ? 'getrentos://magic-link' : ''}` },
    }),

  verifyMagicLink: (token: string) =>
    apiFetch<AuthSession>('/auth/magic-link/verify', {
      method: 'POST',
      anonymous: true,
      body: { token },
    }),

  // ---- OAuth ----------------------------------------------------------
  /** Provider start URL; opened in an in-app browser, redirects back to getrentos://oauth. */
  oauthUrl: (provider: 'google' | 'apple') => `${env.apiUrl}/auth/oauth/${provider}?client=mobile`,
};
