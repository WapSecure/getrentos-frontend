import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { authApi, type OtpMethod } from '../api/auth';
import type { SignupRoleId } from '../roles';
import { useAuth } from './AuthProvider';

/** How the account is created. */
type Method = 'email' | 'phone';

interface Draft {
  method: Method;
  /** How the verification code is delivered — `whatsapp` still creates a phone account. */
  otpMethod: OtpMethod;
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  referralCode?: string;
}

interface SignupContextValue {
  draft: Draft | null;
  otpReference: string | null;
  selectedRoles: SignupRoleId[];
  multiRole: boolean;
  /** Step 1 → sends the OTP and records the draft. */
  startVerification: (draft: Draft) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  toggleRole: (id: SignupRoleId) => void;
  setMultiRole: (v: boolean) => void;
  /** Final step → creates the account and signs the user in. */
  createAccount: () => Promise<void>;
  reset: () => void;
}

const SignupContext = createContext<SignupContextValue | null>(null);

export function useSignup(): SignupContextValue {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error('useSignup must be used within a <SignupProvider>');
  return ctx;
}

export function SignupProvider({ children }: { children: ReactNode }) {
  const { applyExternalSession } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [otpReference, setOtpReference] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<SignupRoleId[]>(['renter']);
  const [multiRole, setMultiRole] = useState(false);

  const startVerification = useCallback(async (next: Draft) => {
    const identifier = next.method === 'email' ? next.email! : next.phone!;
    const { reference } = await authApi.sendOtp(identifier, next.otpMethod, 'signup');
    setDraft(next);
    setOtpReference(reference);
    setSelectedRoles(['renter']);
  }, []);

  const verify = useCallback(
    async (code: string) => {
      if (!otpReference) throw new Error('Your verification session expired. Start again.');
      const { verified } = await authApi.verifyOtp(otpReference, code);
      if (!verified) throw new Error('That code is invalid or has expired.');
    },
    [otpReference]
  );

  const resend = useCallback(async () => {
    if (!otpReference) return;
    await authApi.resendOtp(otpReference);
  }, [otpReference]);

  const toggleRole = useCallback(
    (id: SignupRoleId) => {
      setSelectedRoles((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((r) => r !== id);
          return next.length ? next : prev; // keep at least one
        }
        return multiRole ? [...prev, id] : [id];
      });
    },
    [multiRole]
  );

  const handleSetMultiRole = useCallback((v: boolean) => {
    setMultiRole(v);
    if (!v) setSelectedRoles((prev) => (prev.length ? [prev[0]] : ['renter']));
  }, []);

  const createAccount = useCallback(async () => {
    if (!draft || !otpReference) throw new Error('Your verification session expired. Start again.');
    const session = await authApi.signup({
      email: draft.method === 'email' ? draft.email : undefined,
      phone: draft.method === 'phone' ? draft.phone : undefined,
      fullName: draft.fullName,
      password: draft.password,
      method: draft.method,
      selectedRoles,
      reference: otpReference,
      referralCode: draft.referralCode || undefined,
    });
    applyExternalSession(session);
  }, [draft, otpReference, selectedRoles, applyExternalSession]);

  const reset = useCallback(() => {
    setDraft(null);
    setOtpReference(null);
    setSelectedRoles(['renter']);
    setMultiRole(false);
  }, []);

  const value = useMemo<SignupContextValue>(
    () => ({
      draft,
      otpReference,
      selectedRoles,
      multiRole,
      startVerification,
      verify,
      resend,
      toggleRole,
      setMultiRole: handleSetMultiRole,
      createAccount,
      reset,
    }),
    [
      draft,
      otpReference,
      selectedRoles,
      multiRole,
      startVerification,
      verify,
      resend,
      toggleRole,
      handleSetMultiRole,
      createAccount,
      reset,
    ]
  );

  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
}
