import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useSignupStore } from '@/lib/store/signupStore';
import { authService } from '@/services/authService';
import { saveAuthSession } from '@/lib/authStorage';
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
    mutationFn: ({
      identifier,
      method,
    }: {
      identifier: string;
      method: 'email' | 'phone' | 'whatsapp';
    }) => authService.sendOtp(identifier, method, 'signup'),
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

  const sendOtp = async (identifier: string, method: 'email' | 'phone' | 'whatsapp') => {
    setError(null);

    // A fresh signup always starts as Renter — never inherit a role selection
    // from a previous (persisted) attempt.
    setData({ selectedRoles: ['renter'] });

    const response = await sendOtpMutation.mutateAsync({ identifier, method });

    if (response.success && response.data) {
      setOtpReference(response.data.reference);
      setStep('otp');
    } else {
      setError(response.message || 'Failed to send OTP');
    }

    return response.success;
  };

  const verifyOtp = async (otp: string) => {
    setError(null);

    const response = await verifyOtpMutation.mutateAsync(otp);

    if (response.success && response.data) {
      setData({ isVerified: true });
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
    setError(null);

    if (!otpReference) {
      setError('Your verification session expired. Please start over.');
      return false;
    }

    const response = await createAccountMutation.mutateAsync();

    if (response.success && response.data) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluded from the saved session payload
      const { accessToken, expiresIn: _expiresIn, ...user } = response.data;
      saveAuthSession(
        {
          accessToken,
          user: { ...user, fullName: user.legalName, role: data.selectedRoles[0] },
        },
        true
      );
      localStorage.setItem(STORAGE_KEYS.SELECTED_ROLES, JSON.stringify(data.selectedRoles));

      // Account is created now — route to the primary role dashboard. If the
      // account was created pre-verified (auto face match), the dashboard is
      // fully unlocked; otherwise the caller decided when to run verification.
      const primaryRole = data.selectedRoles[0];
      router.push(getDashboardRoute(primaryRole));
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

  // Whether any selected role requires identity verification before it can
  // be used (landlord/owner/realtor/agent). Callers use this to decide
  // whether to run the verification wizard before creating the account.
  const needsVerification = data.selectedRoles.some((roleId: string) =>
    (ROLES_REQUIRING_VERIFICATION as readonly string[]).includes(roleId)
  );

  return {
    signupData: data,
    step,
    otpReference,
    needsVerification,
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
