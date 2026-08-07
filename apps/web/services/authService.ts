import { SignupData } from '@/lib/store/signupStore';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Mock API calls - replace with actual API integration
export const authService = {
  async sendOtp(
    identifier: string,
    method: 'email' | 'phone'
  ): Promise<ApiResponse<{ reference: string }>> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response
    return {
      success: true,
      message: `OTP sent to your ${method}`,
      data: { reference: 'mock_ref_' + Date.now() },
    };
  },

  async verifyOtp(otp: string, reference: string): Promise<ApiResponse<{ verified: boolean }>> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock OTP validation - accept 123456 for demo
    if (otp === '123456') {
      return {
        success: true,
        message: 'OTP verified successfully',
        data: { verified: true },
      };
    }

    return {
      success: false,
      error: 'Invalid OTP',
      message: 'The verification code you entered is incorrect',
    };
  },

  async createAccount(data: SignupData): Promise<ApiResponse<{ user: unknown; token: string }>> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock account creation
    return {
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: 'user_' + Date.now(),
          email: data.email,
          phone: data.phone,
          fullName: data.fullName,
          roles: data.selectedRoles,
          isVerified: data.isVerified,
          trustScore: 0,
        },
        token: 'mock_jwt_token_' + Date.now(),
      },
    };
  },

  async resendOtp(reference: string): Promise<ApiResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      message: 'OTP resent successfully',
    };
  },
};
