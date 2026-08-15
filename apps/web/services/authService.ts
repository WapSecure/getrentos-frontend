import { apiFetch, ApiError } from '@/lib/apiClient';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  legalName: string;
  isVerified: boolean;
  /** Backend RoleType values, e.g. "RENTER", "PROPERTY_OWNER" */
  roles: string[];
  trustScore: number;
}

export interface AuthResult extends AuthUser {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

type OtpPurpose = 'signup' | 'password_reset';

async function safeCall<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, error: err.message, message: err.message };
    }
    return {
      success: false,
      error: 'Something went wrong',
      message: 'Something went wrong. Please try again.',
    };
  }
}

export const authService = {
  async sendOtp(
    identifier: string,
    method: 'email' | 'phone',
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
  }): Promise<ApiResponse<AuthResult>> {
    return safeCall(() =>
      apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async login(identifier: string, password: string): Promise<ApiResponse<AuthResult>> {
    return safeCall(() =>
      apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      })
    );
  },

  /** URL to start OAuth sign-in for a provider (browser redirect). */
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

  async verifyMagicLink(token: string): Promise<ApiResponse<AuthResult>> {
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
