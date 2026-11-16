import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toE164Phone } from '@sureground/shared';
import { authApi, type OtpMethod } from '../api/auth';
import type { SignupRoleId } from '../roles';
import { useAuth } from './AuthProvider';
import { track } from '../analytics';
import { trackShowroom } from '../showroomAnalytics';
import { clearSignupDraft, loadSignupDraft, saveSignupDraft } from './signupDraft';
import { precheckSignup, type SignupIssue } from './signupErrors';

type Method = 'email' | 'phone';

interface Draft {
  method: Method;
  /** `whatsapp` still creates a phone account. */
  otpMethod: OtpMethod;
  fullName: string;
  email?: string;
  phone?: string;
  /** Empty after the app restarts mid sign-up; the roles step asks again. */
  password: string;
  referralCode?: string;
}

/** What step 1 shows, kept across Back, a method switch and a return from a later step. */
export interface StepOneValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  acceptedTerms: boolean;
  referral: string;
}

const EMPTY_VALUES: StepOneValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  acceptedTerms: false,
  referral: '',
};

export class SignupFieldError extends Error {
  constructor(readonly issue: SignupIssue) {
    super(issue.message);
    this.name = 'SignupFieldError';
  }
}

interface SignupContextValue {
  /** False until a sign-up saved before the app was closed has been looked for. */
  restored: boolean;
  /** Where a restored sign-up picks up, once. */
  resumeAt: 'verify' | 'roles' | null;
  clearResume: () => void;
  draft: Draft | null;
  otpReference: string | null;
  sentAt: number | null;
  values: StepOneValues;
  saveValues: (next: Partial<StepOneValues>) => void;
  /** A refusal from a later step that belongs on a step-1 field. */
  issue: SignupIssue | null;
  setIssue: (issue: SignupIssue | null) => void;
  selectedRoles: SignupRoleId[];
  multiRole: boolean;
  startVerification: (draft: Draft) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  toggleRole: (id: SignupRoleId) => void;
  setMultiRole: (v: boolean) => void;
  setPrimaryRole: (id: SignupRoleId) => void;
  createAccount: (password?: string) => Promise<void>;
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
  const [restored, setRestored] = useState(false);
  const [resumeAt, setResumeAt] = useState<'verify' | 'roles' | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [otpReference, setOtpReference] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [values, setValues] = useState<StepOneValues>(EMPTY_VALUES);
  const [issue, setIssue] = useState<SignupIssue | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<SignupRoleId[]>([]);
  const [multiRole, setMultiRole] = useState(true);

  useEffect(() => {
    let alive = true;
    void loadSignupDraft().then((saved) => {
      if (!alive) return;
      if (saved) {
        const isEmail = saved.method === 'email';
        setDraft({
          method: saved.method,
          otpMethod: saved.otpMethod,
          fullName: saved.fullName,
          email: isEmail ? saved.identifier : undefined,
          phone: isEmail ? undefined : saved.identifier,
          password: '',
          referralCode: saved.referralCode,
        });
        setOtpReference(saved.otpReference);
        setSentAt(saved.sentAt);
        setValues({
          ...EMPTY_VALUES,
          fullName: saved.fullName,
          email: isEmail ? saved.identifier : '',
          phone: isEmail ? '' : saved.identifier,
          referral: saved.referralCode ?? '',
        });
        setResumeAt(saved.verified ? 'roles' : 'verify');
      }
      setRestored(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const saveValues = useCallback((next: Partial<StepOneValues>) => {
    setValues((prev) => ({ ...prev, ...next }));
  }, []);

  const startVerification = useCallback(async (next: Draft) => {
    const found = await precheckSignup(
      { password: next.password, referralCode: next.referralCode },
      next.method
    );
    if (found) throw new SignupFieldError(found);

    const phone = next.method === 'phone' ? (toE164Phone(next.phone) ?? next.phone) : undefined;
    const identifier = next.method === 'email' ? next.email! : phone!;
    const { reference } = await authApi.sendOtp(identifier, next.otpMethod, 'signup');
    const now = Date.now();
    setDraft({ ...next, phone });
    setOtpReference(reference);
    setSentAt(now);
    setIssue(null);
    setSelectedRoles([]);
    void saveSignupDraft({
      method: next.method,
      otpMethod: next.otpMethod,
      fullName: next.fullName,
      identifier,
      otpReference: reference,
      sentAt: now,
      referralCode: next.referralCode,
    });
    track('sign_up_started', { method: next.otpMethod });
    trackShowroom({
      name: 'signup_start',
      surface: 'app_signup',
      props: { method: next.otpMethod },
    });
  }, []);

  const verify = useCallback(
    async (code: string) => {
      if (!otpReference || !draft || !sentAt) {
        throw new Error('Your verification session expired. Start again.');
      }
      const { verified } = await authApi.verifyOtp(otpReference, code);
      if (!verified) throw new Error('That code is invalid or has expired.');
      void saveSignupDraft({
        method: draft.method,
        otpMethod: draft.otpMethod,
        fullName: draft.fullName,
        identifier: (draft.method === 'email' ? draft.email : draft.phone) ?? '',
        otpReference,
        sentAt,
        verified: true,
        referralCode: draft.referralCode,
      });
    },
    [otpReference, draft, sentAt]
  );

  const resend = useCallback(async () => {
    if (!otpReference) return;
    await authApi.resendOtp(otpReference);
    setSentAt(Date.now());
  }, [otpReference]);

  const toggleRole = useCallback(
    (id: SignupRoleId) => {
      setSelectedRoles((prev) => {
        if (prev.includes(id)) return prev.filter((r) => r !== id);
        return multiRole ? [...prev, id] : [id];
      });
    },
    [multiRole]
  );

  const handleSetMultiRole = useCallback((v: boolean) => {
    setMultiRole(v);
    if (!v) setSelectedRoles((prev) => prev.slice(0, 1));
  }, []);

  // The first role is the one the account starts in.
  const setPrimaryRole = useCallback((id: SignupRoleId) => {
    setSelectedRoles((prev) => (prev.includes(id) ? [id, ...prev.filter((r) => r !== id)] : prev));
  }, []);

  const createAccount = useCallback(
    async (password?: string) => {
      if (!draft || !otpReference) {
        throw new Error('Your verification session expired. Start again.');
      }
      const session = await authApi.signup({
        email: draft.method === 'email' ? draft.email : undefined,
        phone: draft.method === 'phone' ? draft.phone : undefined,
        fullName: draft.fullName,
        password: draft.password || password || '',
        method: draft.method,
        selectedRoles,
        reference: otpReference,
        referralCode: draft.referralCode || undefined,
      });
      await clearSignupDraft();
      const props = { method: draft.method, role: selectedRoles[0] ?? 'renter' } as const;
      track('sign_up_completed', props);
      trackShowroom({ name: 'signup_complete', surface: 'app_signup', props });
      await applyExternalSession(session);
    },
    [draft, otpReference, selectedRoles, applyExternalSession]
  );

  const reset = useCallback(() => {
    setDraft(null);
    setOtpReference(null);
    setSentAt(null);
    setIssue(null);
    setResumeAt(null);
    setSelectedRoles([]);
    setMultiRole(true);
    void clearSignupDraft();
  }, []);

  const clearResume = useCallback(() => setResumeAt(null), []);

  const value = useMemo<SignupContextValue>(
    () => ({
      restored,
      resumeAt,
      clearResume,
      draft,
      otpReference,
      sentAt,
      values,
      saveValues,
      issue,
      setIssue,
      selectedRoles,
      multiRole,
      startVerification,
      verify,
      resend,
      toggleRole,
      setMultiRole: handleSetMultiRole,
      setPrimaryRole,
      createAccount,
      reset,
    }),
    [
      restored,
      resumeAt,
      clearResume,
      draft,
      otpReference,
      sentAt,
      values,
      saveValues,
      issue,
      selectedRoles,
      multiRole,
      startVerification,
      verify,
      resend,
      toggleRole,
      handleSetMultiRole,
      setPrimaryRole,
      createAccount,
      reset,
    ]
  );

  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
}
