import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupStore } from '@/lib/store/signupStore';
import { authService } from '@/services/authService';
import { ROUTES, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

export const useSignup = () => {
  const router = useRouter();
  const {
    data,
    step,
    setData,
    setStep,
    addRole,
    removeRole,
    canAddMoreRoles,
    setCanAddMoreRoles,
    reset,
  } = useSignupStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpReference, setOtpReference] = useState<string | null>(null);

  useEffect(() => {
    console.log('Current signup state:', {
      step,
      isVerified: data.isVerified,
      selectedRoles: data.selectedRoles,
    });
  }, [data, step]);

  const sendOtp = async (identifier: string, method: 'email' | 'phone') => {
    console.log('Sending OTP to:', identifier, method);
    setIsLoading(true);
    setError(null);

    const response = await authService.sendOtp(identifier, method);
    console.log('Send OTP response:', response);

    if (response.success && response.data) {
      setOtpReference(response.data.reference || null);
      setStep('otp');
      console.log('Step changed to OTP');
    } else {
      setError(response.message || 'Failed to send OTP');
    }

    setIsLoading(false);
    return response.success;
  };

  const verifyOtp = async (otp: string) => {
    console.log('Verifying OTP:', otp);
    setIsLoading(true);
    setError(null);

    const response = await authService.verifyOtp(otp, otpReference || '');
    console.log('Verify OTP response:', response);

    if (response.success && response.data) {
      setData({ isVerified: true });
      console.log('OTP verified, navigating to role selection');
      router.push(ROUTES.ROLE_SELECTION);
    } else {
      setError(response.message || 'Invalid OTP');
    }

    setIsLoading(false);
    return response.success;
  };

  const resendOtp = async () => {
    if (!otpReference) return false;

    setIsLoading(true);
    setError(null);

    const response = await authService.resendOtp(otpReference);

    if (!response.success) {
      setError(response.message || 'Failed to resend OTP');
    }

    setIsLoading(false);
    return response.success;
  };

  const createAccount = async () => {
    console.log('Creating account with data:', data);
    setIsLoading(true);
    setError(null);

    const response = await authService.createAccount(data);
    console.log('Create account response:', response);

    if (response.success && response.data) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
      localStorage.setItem(STORAGE_KEYS.SELECTED_ROLES, JSON.stringify(data.selectedRoles));

      const primaryRole = data.selectedRoles[0];

      const needsVerification = data.selectedRoles.some(
        (roleId: string) => roleId === 'landlord' || roleId === 'owner' || roleId === 'realtor'
      );

      if (needsVerification) {
        router.push(ROUTES.VERIFICATION);
      } else {
        router.push(getDashboardRoute(primaryRole));
      }
    } else {
      setError(response.message || 'Failed to create account');
    }

    setIsLoading(false);
    return response.success;
  };

  const addRoleToSelection = (roleId: string) => {
    addRole(roleId);
  };

  const removeRoleFromSelection = (roleId: string) => {
    removeRole(roleId);
  };

  const resetSignup = () => {
    reset();
    setOtpReference(null);
    setError(null);
  };

  return {
    signupData: data,
    step,
    isLoading,
    error,
    canAddMoreRoles,
    sendOtp,
    verifyOtp,
    resendOtp,
    createAccount,
    setStep,
    addRole: addRoleToSelection,
    removeRole: removeRoleFromSelection,
    setCanAddMoreRoles,
    resetSignup,
  };
};
