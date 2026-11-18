import { apiFetch, CLIENT_APP } from './apiClient';
import { installIdHeader } from './installId';
import { authFetch, safeCall } from './apiHelpers';
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
  // Set when an OAuth or Apple sign-in created the account in that call.
  isNewUser?: boolean;
}

// Nothing about the account is sent until the second factor is passed.
export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  challengeToken: string;
  expiresIn: number;
}

export type LoginResult = AuthResult | TwoFactorChallenge;

type OtpPurpose = 'signup' | 'password_reset';

export type SignupPrecheckField = 'password' | 'referralCode';

/** Signs of a form filled by a bot; the API then answers as usual but sends no code. */
export interface OtpBotCheck {
  website?: string;
  formElapsedMs?: number;
}

export const SIGN_IN_UNAVAILABLE_CODES = ['SIGN_IN_UNAVAILABLE', 'TWO_FACTOR_UNAVAILABLE'] as const;
export const SIGN_IN_UNAVAILABLE_COPY = 'Sign-in is temporarily unavailable. Try again shortly.';

// The API answers 503 with these when it can't count attempts; the generic 5xx copy would read as an outage.
function withSignInCopy<T>(response: ApiResponse<T>): ApiResponse<T> {
  if (response.success) return response;
  if (!(SIGN_IN_UNAVAILABLE_CODES as readonly (string | undefined)[]).includes(response.code)) {
    return response;
  }
  return { ...response, error: SIGN_IN_UNAVAILABLE_COPY, message: SIGN_IN_UNAVAILABLE_COPY };
}

export const authService = {
  async sendOtp(
    identifier: string,
    method: 'email' | 'phone' | 'whatsapp',
    purpose: OtpPurpose = 'signup',
    botCheck: OtpBotCheck = {}
  ): Promise<ApiResponse<{ reference: string }>> {
    return safeCall(() =>
      apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ identifier, method, purpose, ...botCheck }),
      })
    );
  },

  // Checks step-one answers before a code is sent. Older APIs answer 404; callers then carry on.
  async signupPrecheck(body: {
    password?: string;
    referralCode?: string;
  }): Promise<ApiResponse<{ ok: true }>> {
    return safeCall(() =>
      apiFetch<{ ok: true }>(
        '/auth/signup/precheck',
        { method: 'POST', body: JSON.stringify(body) },
        false
      )
    );
  },

  // Only open for a short while after a social sign-in created the account.
  async setInitialRoles(selectedRoles: string[]): Promise<ApiResponse<AuthUser>> {
    return safeCall(() =>
      authFetch<AuthUser>('/auth/initial-roles', {
        method: 'POST',
        body: JSON.stringify({ selectedRoles }),
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
    return withSignInCopy(
      await safeCall(() =>
        apiFetch<LoginResult>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password, rememberMe }),
          headers: app ? { 'x-client-app': app } : undefined,
        })
      )
    );
  },

  async acceptStaffInvite(
    token: string,
    password: string
  ): Promise<ApiResponse<{ message: string }>> {
    return safeCall(() =>
      apiFetch<{ message: string }>(
        '/auth/staff-invite/accept',
        { method: 'POST', body: JSON.stringify({ token, password }) },
        false
      )
    );
  },

  async completeTwoFactorLogin(
    challengeToken: string,
    token: string,
    clientApp?: string
  ): Promise<ApiResponse<AuthResult>> {
    const app = clientApp ?? CLIENT_APP;
    return withSignInCopy(
      await safeCall(() =>
        apiFetch<AuthResult>('/auth/login/2fa', {
          method: 'POST',
          body: JSON.stringify({ challengeToken, token }),
          headers: app ? { 'x-client-app': app } : undefined,
        })
      )
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
