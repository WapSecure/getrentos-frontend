import { apiFetch } from './client';

/** Backend RoleType values, e.g. "RENTER", "PROPERTY_OWNER". */
export type BackendRole = string;

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
  /** Present because the app sends `x-client-app: mobile`. */
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

  sendMagicLink: (email: string) =>
    apiFetch<{ message: string }>('/auth/magic-link/send', {
      method: 'POST',
      anonymous: true,
      body: { email },
    }),

  verifyMagicLink: (token: string) =>
    apiFetch<AuthSession>('/auth/magic-link/verify', {
      method: 'POST',
      anonymous: true,
      body: { token },
    }),
};
