import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  authErrorCode,
  authErrorField,
  authErrorMessage,
  toE164Phone,
  type OtpBotCheck,
  type SignupMethod,
} from '@sureground/shared';
import { useSignupStore, type StepOneNotice } from '@/lib/store/signupStore';
import { authService } from '@/services/authService';
import { accountRolesService, type AddableRoleId } from '@/services/accountRolesService';
import { saveAuthSession, updateStoredUser } from '@/lib/authStorage';
import { ROUTES, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import { takeSignupNext } from '@/lib/nextPath';
import { clearSocialSignup } from '@/lib/socialSignup';
import { track } from '@/lib/analytics';
import type { SignupEventRole } from '@sureground/shared/showroom';

const SIGNUP_EVENT_ROLES: readonly string[] = [
  'renter',
  'landlord',
  'owner',
  'buyer',
  'realtor',
  'agent',
  'estate',
] satisfies SignupEventRole[];

const STEP_ONE_FIELDS: Record<string, StepOneNotice['field']> = {
  PASSWORD_TOO_SHORT: 'password',
  PASSWORD_BREACHED: 'password',
  REFERRAL_INVALID: 'referralCode',
};

const EXPIRED_NOTICE: StepOneNotice = {
  message: 'Your code has expired. Check your details and we will send you a new one.',
};
const PASSWORD_NOTICE: StepOneNotice = {
  field: 'password',
  message: 'For your security, enter your password again.',
};

/** What the error banner offers: fix step one, sign in, or carry on to the dashboard. */
export type SignupErrorAction = 'details' | 'signin' | 'dashboard';

export interface SignupError {
  message: string;
  code?: string;
  action?: SignupErrorAction;
  notice?: StepOneNotice;
}

export const useSignup = () => {
  const router = useRouter();
  const {
    data,
    step,
    channel,
    otpReference,
    setData,
    setStep,
    setChannel,
    setOtpReference,
    setNotice,
    addRole,
    removeRole,
    setPrimaryRole,
    returnToDetails,
    reset,
  } = useSignupStore();
  const [error, setError] = useState<SignupError | null>(null);

  const sendOtpMutation = useMutation({
    mutationFn: ({
      identifier,
      method,
      botCheck,
    }: {
      identifier: string;
      method: SignupMethod;
      botCheck?: OtpBotCheck;
    }) => authService.sendOtp(identifier, method, 'signup', botCheck),
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
        phone: data.method === 'phone' ? (toE164Phone(data.phone) ?? data.phone) : undefined,
        fullName: data.fullName,
        password: data.password,
        method: data.method,
        selectedRoles: data.selectedRoles,
        reference: otpReference || '',
        referralCode: data.referralCode || undefined,
      }),
  });
  const initialRolesMutation = useMutation({
    mutationFn: (roles: string[]) => authService.setInitialRoles(roles),
  });
  const precheckMutation = useMutation({
    mutationFn: (body: { password: string; referralCode?: string }) =>
      authService.signupPrecheck(body),
  });

  /** A field problem to show on step one, or null to carry on (also when the API is too old to check). */
  const precheck = async (password: string, referralCode?: string) => {
    const res = await precheckMutation.mutateAsync({ password, referralCode });
    if (res.success || res.status !== 400) return null;
    const code = authErrorCode(res);
    const field = authErrorField(res) ?? (code ? STEP_ONE_FIELDS[code] : undefined);
    if (field !== 'password' && field !== 'referralCode') return null;
    return { field, message: authErrorMessage(res, res.message || '') } satisfies StepOneNotice;
  };

  const sendOtp = async (identifier: string, method: SignupMethod, botCheck?: OtpBotCheck) => {
    setError(null);
    setNotice(null);

    const response = await sendOtpMutation.mutateAsync({ identifier, method, botCheck });

    if (response.success && response.data) {
      setOtpReference(response.data.reference);
      setData({ isVerified: false });
      setStep('otp');
      track({ name: 'signup_start', props: { method } });
    } else {
      const code = authErrorCode(response);
      setError({
        code,
        message: authErrorMessage(response, 'We could not send a code. Try again.'),
        action: code === 'ACCOUNT_EXISTS' ? 'signin' : undefined,
      });
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
      setError({
        code: authErrorCode(response),
        message: authErrorMessage(response, 'That code did not work. Check it and try again.'),
      });
    }

    return response.success;
  };

  /** Resolves with whether a new code went out. */
  const resendOtp = async () => {
    if (!otpReference) return false;

    setError(null);

    const response = await resendOtpMutation.mutateAsync(otpReference);

    if (!response.success) {
      setError({
        code: authErrorCode(response),
        message: authErrorMessage(response, 'We could not send a new code. Try again.'),
      });
    }

    return response.success;
  };

  const needsDetails = (notice: StepOneNotice): false => {
    setError({ message: notice.message, action: 'details', notice });
    return false;
  };

  const createAccount = async () => {
    setError(null);

    if (!otpReference || !data.isVerified) return needsDetails(EXPIRED_NOTICE);
    // The password is held only in memory, so after a reload ask for it again rather than send an empty one.
    if (!data.password) return needsDetails(PASSWORD_NOTICE);

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

      // No verification at signup: identity, licence and ownership checks happen at the point of use.
      const primaryRole = data.selectedRoles[0];
      track({
        name: 'signup_complete',
        props: {
          method: data.method === 'phone' ? 'phone' : 'email',
          ...(SIGNUP_EVENT_ROLES.includes(primaryRole)
            ? { role: primaryRole as SignupEventRole }
            : {}),
        },
      });
      router.push(takeSignupNext() ?? getDashboardRoute(primaryRole));
      reset();
      return true;
    }

    const code = authErrorCode(response);
    const field = code ? STEP_ONE_FIELDS[code] : undefined;
    if (field) {
      return needsDetails({ field, message: authErrorMessage(response, response.message || '') });
    }
    if (code === 'ACCOUNT_EXISTS') {
      setError({ code, message: authErrorMessage(response, ''), action: 'signin' });
      return false;
    }
    // The API refuses a spent or expired verification with a 400 that names it.
    if (response.status === 400 && /verif/i.test(response.message ?? '')) {
      return needsDetails(EXPIRED_NOTICE);
    }
    setError({ code, message: authErrorMessage(response, 'We could not create your account.') });
    return false;
  };

  /** Finishes an account Google just created: swaps the default renter role for the choice. */
  const finishSocialSignup = async () => {
    setError(null);
    const roles = data.selectedRoles;
    const primaryRole = roles[0];
    const done = (backendRoles?: string[]) => {
      updateStoredUser({ role: primaryRole, ...(backendRoles ? { roles: backendRoles } : {}) });
      clearSocialSignup();
      reset();
      router.push(takeSignupNext() ?? getDashboardRoute(primaryRole));
    };

    const response = await initialRolesMutation.mutateAsync(roles);
    if (response.success && response.data) {
      done(response.data.roles);
      return true;
    }

    // An API without /auth/initial-roles: add the extra roles one by one; renter stays.
    if (response.status === 404) {
      let backendRoles: string[] | undefined;
      for (const role of roles.filter((r) => r !== 'renter')) {
        const added = await accountRolesService.addRole(role as AddableRoleId);
        if (added.success && added.data) backendRoles = added.data.roles;
      }
      done(backendRoles);
      return true;
    }

    const code = authErrorCode(response);
    if (code === 'INITIAL_ROLES_CLOSED') clearSocialSignup();
    setError({
      code,
      message: authErrorMessage(response, 'We could not save your choice. Try again.'),
      action: code === 'INITIAL_ROLES_CLOSED' ? 'dashboard' : undefined,
    });
    return false;
  };

  /** Step one again, answers kept; a field notice shows there. */
  const goToDetails = (notice?: StepOneNotice | null) => {
    returnToDetails(notice ?? null);
    setError(null);
    router.push(ROUTES.SIGNUP);
  };

  const resetSignup = () => {
    reset();
    setError(null);
  };

  return {
    signupData: data,
    step,
    channel,
    otpReference,
    isLoading:
      precheckMutation.isPending ||
      sendOtpMutation.isPending ||
      verifyOtpMutation.isPending ||
      resendOtpMutation.isPending ||
      createAccountMutation.isPending ||
      initialRolesMutation.isPending,
    isResending: resendOtpMutation.isPending,
    error,
    clearError: () => setError(null),
    precheck,
    sendOtp,
    verifyOtp,
    resendOtp,
    createAccount,
    finishSocialSignup,
    goToDetails,
    setStep,
    setChannel,
    setData,
    addRole,
    removeRole,
    setPrimaryRole,
    resetSignup,
  };
};
