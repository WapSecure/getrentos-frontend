import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useSignupStore } from '@/lib/store/signupStore';
import { authService } from '@/services/authService';
import {
  ROLES_REQUIRING_VERIFICATION,
  ROUTES,
  STORAGE_KEYS,
  getDashboardRoute,
} from '@/lib/constants/auth';

export const useSignup = () => {
  const router = useRouter();
  const {
    data,
    step,
    otpReference,
    setData,
    setStep,
    setOtpReference,
    addRole,
    removeRole,
    canAddMoreRoles,
    setCanAddMoreRoles,
    reset,
  } = useSignupStore();
  const [error, setError] = useState<string | null>(null);

  const sendOtpMutation = useMutation({
    mutationFn: ({ identifier, method }: { identifier: string; method: 'email' | 'phone' }) =>
      authService.sendOtp(identifier, method, 'signup'),
  });
  const verifyOtpMutation = useMutation({
    mutationFn: (otp: string) => authService.verifyOtp(otp, otpReference || ''),
  });
  const resendOtpMutation = useMutation({
    mutationFn: (reference: string) => authService.resendOtp(reference),
  });
  const createAccountMutation = useMutation({
    mutationFn: () =>
      authService.createAccount({
        email: data.method === 'email' ? data.email : undefined,
        phone: data.method === 'phone' ? data.phone : undefined,
        fullName: data.fullName,
        password: data.password,
        method: data.method,
        selectedRoles: data.selectedRoles,
        reference: otpReference || '',
      }),
  });

  useEffect(() => {
    console.log('Current signup state:', {
      step,
      isVerified: data.isVerified,
      selectedRoles: data.selectedRoles,
    });
  }, [data, step]);

  const sendOtp = async (identifier: string, method: 'email' | 'phone') => {
    console.log('Sending OTP to:', identifier, method);
    setError(null);

    const response = await sendOtpMutation.mutateAsync({ identifier, method });
    console.log('Send OTP response:', response);

    if (response.success && response.data) {
      setOtpReference(response.data.reference);
      setStep('otp');
      console.log('Step changed to OTP');
    } else {
      setError(response.message || 'Failed to send OTP');
    }

    return response.success;
  };

  const verifyOtp = async (otp: string) => {
    console.log('Verifying OTP:', otp);
    setError(null);

    const response = await verifyOtpMutation.mutateAsync(otp);
    console.log('Verify OTP response:', response);

    if (response.success && response.data) {
      setData({ isVerified: true });
      console.log('OTP verified, navigating to role selection');
      router.push(ROUTES.ROLE_SELECTION);
    } else {
      setError(response.message || 'Invalid OTP');
    }

    return response.success;
  };

  const resendOtp = async () => {
    if (!otpReference) return false;

    setError(null);

    const response = await resendOtpMutation.mutateAsync(otpReference);

    if (!response.success) {
      setError(response.message || 'Failed to resend OTP');
    }

    return response.success;
  };

  const createAccount = async () => {
    console.log('Creating account with data:', data);
    setError(null);

    if (!otpReference) {
      setError('Your verification session expired. Please start over.');
      return false;
    }

    const response = await createAccountMutation.mutateAsync();
    console.log('Create account response:', response);

    if (response.success && response.data) {
      const { accessToken, refreshToken, expiresIn: _expiresIn, ...user } = response.data;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify({ ...user, fullName: user.legalName, role: data.selectedRoles[0] })
      );
      localStorage.setItem(STORAGE_KEYS.SELECTED_ROLES, JSON.stringify(data.selectedRoles));

      const primaryRole = data.selectedRoles[0];
      const needsVerification = data.selectedRoles.some((roleId: string) =>
        (ROLES_REQUIRING_VERIFICATION as readonly string[]).includes(roleId)
      );

      if (needsVerification) {
        router.push(ROUTES.VERIFICATION);
      } else {
        router.push(getDashboardRoute(primaryRole));
      }
    } else {
      setError(response.message || 'Failed to create account');
    }

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
    setError(null);
  };

  return {
    signupData: data,
    step,
    isLoading:
      sendOtpMutation.isPending ||
      verifyOtpMutation.isPending ||
      resendOtpMutation.isPending ||
      createAccountMutation.isPending,
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
