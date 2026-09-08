'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Select } from '@getrentos/ui';
import { cn, unwrap } from '@/lib/apiHelpers';
import { kycService } from '@/services/kycService';
import {
  trustService,
  TRUST_ID_TYPES,
  type TrustIdType,
  type TrustPurpose,
} from '@/services/trustService';

const KYC_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  APPROVED: {
    label: 'Verified',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  PENDING_REVIEW: {
    label: 'Pending review',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  NEEDS_CLARIFICATION: {
    label: 'Needs clarification',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
};

const STEP_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PASSED: {
    label: 'Done',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  FAILED: {
    label: 'Failed',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  REVIEW_REQUIRED: {
    label: 'Needs review',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  NOT_STARTED: { label: 'Not started', color: 'text-muted-foreground', bg: 'bg-secondary' },
  IN_PROGRESS: {
    label: 'In progress',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  SKIPPED: { label: 'Skipped', color: 'text-muted-foreground', bg: 'bg-secondary' },
  WAITING_FOR_USER: {
    label: 'Waiting on you',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  WAITING_FOR_PROVIDER: {
    label: 'Waiting on provider',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

const STEP_LABEL: Record<string, string> = {
  PHONE_OTP: 'Phone verification',
  NIN_CHECK: 'National ID (NIN) check',
  BVN_CHECK: 'Bank verification (BVN) check',
  SELFIE_CAPTURE: 'Selfie capture',
  LIVENESS_CHECK: 'Liveness check',
  FACE_MATCH: 'Face match',
  DOCUMENT_CHECK: 'Document check',
  BANK_ACCOUNT_CHECK: 'Bank account check',
  AML_CHECK: 'AML screening',
};

const ACTIONABLE = ['NOT_STARTED', 'FAILED', 'REVIEW_REQUIRED'];
const IDENTITY_STEP_TYPES = ['NIN_CHECK', 'BVN_CHECK'];
const BIO_STEP_TYPES = ['SELFIE_CAPTURE', 'LIVENESS_CHECK', 'FACE_MATCH'];
/** Purposes whose onboarding policy includes the BANK_ACCOUNT_CHECK step (hosts/agents). */
const HOST_ONBOARD_PURPOSES: TrustPurpose[] = [
  'LANDLORD_ONBOARDING',
  'PROPERTY_OWNER_ONBOARDING',
  'AGENT_ONBOARDING',
  'PROPERTY_MANAGER_ONBOARDING',
];

interface VerificationCenterProps {
  subjectId: string;
  purpose: TrustPurpose;
  description?: string;
  /** Persona's identity-document route for the footer tile (renter default if omitted). */
  documentsHref?: string;
  /** Persona's trust-score route for the footer tile (omitted to hide the tile). */
  trustScoreHref?: string;
}

export const VerificationCenter = ({
  subjectId,
  purpose,
  description,
  documentsHref,
  trustScoreHref,
}: VerificationCenterProps) => {
  const queryClient = useQueryClient();
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idType, setIdType] = useState<TrustIdType>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneRef, setPhoneRef] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const autoStarted = useRef(false);

  const invalidateVerification = () =>
    queryClient.invalidateQueries({ queryKey: ['trust-verification', verificationId] });

  const { data: kyc } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
  });

  const { data: verification, isLoading: verificationLoading } = useQuery({
    queryKey: ['trust-verification', verificationId],
    queryFn: () => (verificationId ? unwrap(trustService.getVerification(verificationId)) : null),
    enabled: Boolean(verificationId),
  });

  const { data: consents } = useQuery({
    queryKey: ['trust-consents'],
    queryFn: () => unwrap(trustService.listConsents()),
  });
  const idCheckConsent = consents?.find((c) => c.consentType === 'ID_CHECK');
  const bioConsent = consents?.find((c) => c.consentType === 'BIOMETRIC');
  const bankConsent = consents?.find((c) => c.consentType === 'BANK_ACCOUNT_CHECK');

  const startMutation = useMutation({
    mutationFn: () => unwrap(trustService.startVerification({ subjectId, purpose, country: 'NG' })),
    onSuccess: (v) => {
      setVerificationId(v.id);
      setError(null);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to load your verification.'),
  });

  // Idempotently start/resume the orchestrated verification once (start is
  // safe: resumes an open verification or creates one for the signed-in user).
  useEffect(() => {
    if (
      subjectId &&
      kyc &&
      kyc.verificationStatus !== 'APPROVED' &&
      !autoStarted.current &&
      !startMutation.isPending
    ) {
      autoStarted.current = true;
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, kyc?.verificationStatus]);

  const grantIdMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.grantConsent({
          consentType: 'ID_CHECK',
          purpose: 'Identity verification',
          expiresInDays: 365,
        })
      ),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['trust-consents'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to record consent.'),
  });

  const grantBioMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.grantConsent({
          consentType: 'BIOMETRIC',
          purpose: 'Biometric verification',
          expiresInDays: 365,
        })
      ),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['trust-consents'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to record consent.'),
  });

  const grantBankMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.grantConsent({
          consentType: 'BANK_ACCOUNT_CHECK',
          purpose: 'Financial verification',
          expiresInDays: 365,
        })
      ),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['trust-consents'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to record consent.'),
  });

  const revokeConsentMutation = useMutation({
    mutationFn: (consentId: string) => unwrap(trustService.revokeConsent(consentId)),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['trust-consents'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to revoke consent.'),
  });

  const identityMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.submitIdentity(verificationId!, {
          idType,
          idNumber: idNumber.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          country: 'NG',
        })
      ),
    onSuccess: () => {
      setIdNumber('');
      setFirstName('');
      setLastName('');
      setError(null);
      invalidateVerification();
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to run that check.'),
  });

  const sendOtpMutation = useMutation({
    mutationFn: () => unwrap(trustService.sendPhoneOtp(verificationId!)),
    onSuccess: (data) => {
      setPhoneRef(data.reference);
      setError(null);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to send the code.'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () =>
      unwrap(trustService.verifyPhoneOtp(verificationId!, { reference: phoneRef!, code: otpCode })),
    onSuccess: () => {
      setPhoneRef(null);
      setOtpCode('');
      setError(null);
      invalidateVerification();
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to verify the code.'),
  });

  const bioMutation = useMutation({
    mutationFn: () => unwrap(trustService.submitBiometrics(verificationId!, selfie!)),
    onSuccess: () => {
      setSelfie(null);
      setError(null);
      invalidateVerification();
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to run the biometric check.'),
  });

  const bankMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.submitBankAccount(verificationId!, {
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim() || undefined,
          bankCode: bankCode.trim() || undefined,
          country: 'NG',
        })
      ),
    onSuccess: () => {
      setAccountNumber('');
      setAccountName('');
      setBankCode('');
      setError(null);
      invalidateVerification();
      // Bank completion can lift the account to tier 3 — refresh the chip.
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to run the bank check.'),
  });

  const isVerified = Boolean(kyc?.isVerified) || kyc?.verificationStatus === 'APPROVED';
  const kycMeta =
    KYC_STATUS_META[kyc?.verificationStatus ?? 'PENDING_REVIEW'] ?? KYC_STATUS_META.PENDING_REVIEW;

  const steps = verification?.steps ?? [];
  const actionable = (status: string) => ACTIONABLE.includes(status);
  const runnableIdentity = steps.find(
    (s) => IDENTITY_STEP_TYPES.includes(s.stepType) && actionable(s.status)
  );
  const runnablePhone = steps.find((s) => s.stepType === 'PHONE_OTP' && actionable(s.status));
  const runnableBio = steps.find(
    (s) => BIO_STEP_TYPES.includes(s.stepType) && actionable(s.status)
  );
  // Bank step only applies to host/agent onboardings (renter policies skip it).
  const bankRequired =
    verification !== undefined
      ? steps.some((s) => s.stepType === 'BANK_ACCOUNT_CHECK')
      : HOST_ONBOARD_PURPOSES.includes(purpose);
  const runnableBank = bankRequired
    ? steps.find((s) => s.stepType === 'BANK_ACCOUNT_CHECK' && actionable(s.status))
    : undefined;

  const identityEnabled =
    Boolean(runnableIdentity) &&
    Boolean(verificationId) &&
    idNumber.trim().length > 0 &&
    Boolean(idCheckConsent) &&
    !identityMutation.isPending;
  const otpVerifyEnabled =
    Boolean(phoneRef) && otpCode.length === 6 && !verifyOtpMutation.isPending;
  const bioEnabled = Boolean(selfie) && Boolean(bioConsent) && !bioMutation.isPending;
  const bankEnabled =
    Boolean(runnableBank) &&
    Boolean(verificationId) &&
    accountNumber.trim().length > 0 &&
    Boolean(bankConsent) &&
    !bankMutation.isPending;

  const renderConsentRow = (opts: {
    consent?: { id: string; revokedAt?: string; grantedAt: string };
    icon: React.ElementType;
    title: string;
    body: string;
    onGrant: () => void;
    granting: boolean;
    revoking: boolean;
  }) => {
    const consent = opts.consent;
    const active = Boolean(consent && !consent.revokedAt);
    const Icon = opts.icon;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{opts.title}</h3>
            <p className="text-xs text-muted-foreground">{opts.body}</p>
          </div>
        </div>
        {active && consent ? (
          <Button
            variant="outline"
            size="sm"
            disabled={opts.revoking}
            onClick={() => revokeConsentMutation.mutate(consent.id)}
          >
            {opts.revoking ? 'Revoking…' : 'Revoke consent'}
          </Button>
        ) : (
          <Button size="sm" disabled={opts.granting} onClick={opts.onGrant}>
            {opts.granting ? 'Recording…' : 'Grant consent'}
          </Button>
        )}
        {active && consent && (
          <p className="w-full text-xs text-green-700 dark:text-green-400">
            Active · granted {new Date(consent.grantedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isVerified ? (
                <BadgeCheck className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Verification Center</h2>
              <p className="text-sm text-muted-foreground">
                {description ??
                  'Verify your identity to unlock renting, payments and higher trust limits.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                kycMeta.bg,
                kycMeta.color
              )}
            >
              {kycMeta.label}
            </span>
            {kyc?.trustScore !== undefined && (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                Trust score {kyc.trustScore}
              </span>
            )}
            {kyc?.tier !== undefined && (
              <span className="rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary">
                Tier {kyc.tier}
              </span>
            )}
          </div>
        </div>

        {kyc?.verificationStatus === 'REJECTED' && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Your previous verification was rejected. Please review your details and try again.
          </p>
        )}
      </div>

      {/* Consents */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        {renderConsentRow({
          consent: idCheckConsent,
          icon: Fingerprint,
          title: 'Identity-check consent',
          body: 'We check your NIN/BVN against official records. Your number is never shown to other users.',
          onGrant: () => grantIdMutation.mutate(),
          granting: grantIdMutation.isPending,
          revoking: revokeConsentMutation.isPending,
        })}
        <div className="border-t border-border" />
        {renderConsentRow({
          consent: bioConsent,
          icon: Camera,
          title: 'Biometric consent',
          body: 'We capture a selfie and run liveness + face checks. Used only for this verification.',
          onGrant: () => grantBioMutation.mutate(),
          granting: grantBioMutation.isPending,
          revoking: revokeConsentMutation.isPending,
        })}
        {bankRequired && (
          <>
            <div className="border-t border-border" />
            {renderConsentRow({
              consent: bankConsent,
              icon: Landmark,
              title: 'Bank-account consent',
              body: 'We check the account is yours via a name enquiry. Completing this lifts you to Trust Tier 3 (financially verified).',
              onGrant: () => grantBankMutation.mutate(),
              granting: grantBankMutation.isPending,
              revoking: revokeConsentMutation.isPending,
            })}
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step checklist */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Identity checklist</h3>
          {verification && (
            <span className="text-xs text-muted-foreground">
              {verification.passedSteps} of {verification.stepCount} passed · {verification.status}
            </span>
          )}
        </div>

        {verificationLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : verification ? (
          <>
            <div className="space-y-2">
              {steps.map((step) => {
                const meta = STEP_STATUS_META[step.status] ?? {
                  label: step.status,
                  color: 'text-muted-foreground',
                  bg: 'bg-secondary',
                };
                const runnable =
                  [
                    ...IDENTITY_STEP_TYPES,
                    ...BIO_STEP_TYPES,
                    'PHONE_OTP',
                    'BANK_ACCOUNT_CHECK',
                  ].includes(step.stepType) && actionable(step.status);
                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
                      runnable ? 'border-primary/40 bg-primary/5' : 'border-border'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {step.status === 'PASSED' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Fingerprint className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {STEP_LABEL[step.stepType] ?? step.stepType}
                        </p>
                        {step.provider && (
                          <p className="text-[11px] text-muted-foreground">via {step.provider}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        meta.bg,
                        meta.color
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Identity (NIN/BVN) runner */}
            {runnableIdentity && (
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Complete: {STEP_LABEL[runnableIdentity.stepType]}
                </p>
                {!idCheckConsent && (
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                    Grant identity-check consent above before running this check.
                  </p>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      ID type
                    </label>
                    <Select
                      value={idType}
                      onValueChange={(value) => setIdType(value as TrustIdType)}
                      options={TRUST_ID_TYPES.map((type) => ({ value: type, label: type }))}
                      className="w-full"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {idType === 'NIN'
                        ? 'NIN number'
                        : idType === 'BVN'
                          ? 'BVN number'
                          : 'ID number'}
                    </label>
                    <Input
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder={idType === 'NIN' || idType === 'BVN' ? '11 digits' : 'Number'}
                      className="w-full"
                      inputMode="numeric"
                    />
                  </div>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name (optional)"
                    className="w-full"
                  />
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name (optional)"
                    className="w-full"
                  />
                </div>
                <Button
                  className="mt-4"
                  size="sm"
                  disabled={!identityEnabled}
                  onClick={() => identityMutation.mutate()}
                >
                  {identityMutation.isPending ? 'Checking…' : 'Run identity check'}
                </Button>
              </div>
            )}

            {/* Phone OTP runner */}
            {runnablePhone && (
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Complete: Phone verification
                </p>
                {!phoneRef ? (
                  <Button
                    className="mt-3"
                    size="sm"
                    disabled={sendOtpMutation.isPending}
                    onClick={() => sendOtpMutation.mutate()}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    {sendOtpMutation.isPending ? 'Sending…' : 'Send code to my phone'}
                  </Button>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Code sent — in development it is printed to the backend log.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        className="w-40"
                        inputMode="numeric"
                      />
                      <Button
                        size="sm"
                        disabled={!otpVerifyEnabled}
                        onClick={() => verifyOtpMutation.mutate()}
                      >
                        {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify code'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Biometrics runner */}
            {runnableBio && (
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Complete: Selfie + biometric check
                </p>
                {!bioConsent && (
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                    Grant biometric consent above before running this check.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selfieInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {selfie ? selfie.name.slice(0, 30) : 'Choose a selfie'}
                  </Button>
                  <Button size="sm" disabled={!bioEnabled} onClick={() => bioMutation.mutate()}>
                    {bioMutation.isPending ? 'Running…' : 'Run biometric check'}
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Runs selfie capture, liveness and face-match in one step.
                </p>
              </div>
            )}

            {/* Bank account runner */}
            {runnableBank && (
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Complete: Bank account check
                </p>
                {!bankConsent && (
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                    Grant bank-account consent above before running this check.
                  </p>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Account number (10 digits)
                    </label>
                    <Input
                      value={accountNumber}
                      onChange={(e) =>
                        setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="0123456789"
                      className="w-full"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Bank code (optional)
                    </label>
                    <Input
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      placeholder="e.g. 058"
                      className="w-full"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Account holder name (optional — compared for a match)
                    </label>
                    <Input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. ACCT HOLDER 6789"
                      className="w-full"
                    />
                  </div>
                </div>
                <Button
                  className="mt-4"
                  size="sm"
                  disabled={!bankEnabled}
                  onClick={() => bankMutation.mutate()}
                >
                  {bankMutation.isPending ? 'Checking…' : 'Run bank check'}
                </Button>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Passing this step marks you financially verified (Trust Tier 3).
                </p>
              </div>
            )}

            {verification.decision === 'REJECT' && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                This verification was rejected. Contact support if you believe this is a mistake.
              </p>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {startMutation.isPending
              ? 'Preparing your verification…'
              : 'Your verification is ready to start. Reload if it does not appear.'}
          </div>
        )}
      </div>

      {/* Document path + trust score links — role-aware per mounting page */}
      {(documentsHref || trustScoreHref) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {documentsHref && (
            <Link
              href={documentsHref}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <FileCheck2 className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Upload an identity document</p>
                <p className="text-xs text-muted-foreground">
                  Scan your national ID or passport for a human-reviewed verification.
                </p>
              </div>
              <span className="text-primary transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          )}
          {trustScoreHref && (
            <Link
              href={trustScoreHref}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Your trust score</p>
                <p className="text-xs text-muted-foreground">See how your score grows over time.</p>
              </div>
              <span className="text-primary transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
