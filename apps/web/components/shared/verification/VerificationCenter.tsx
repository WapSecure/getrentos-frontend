'use client';

import { ChangePhoneButton } from '@/components/shared/security/ChangePhoneButton';
import { trustKeys } from '@/lib/queryKeys';
import { IdentityDocumentFallback } from './IdentityDocumentFallback';
import { TrustConsentPrompt } from './TrustConsentPrompt';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NIGERIAN_BANKS } from '@/lib/banks';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Fingerprint,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
} from '@sureground/icons';
import Link from 'next/link';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  NumberInput,
  Progress,
  Select,
  Skeleton,
  type BadgeVariant,
} from '@sureground/ui';
import { TIER_LABELS } from './trustTiers';
import { LiveSelfieCapture, liveCaptureBlocker } from './LiveSelfieCapture';
import type { SmileLivenessSession } from '@/services/trustService';
import { cn, unwrap } from '@/lib/apiHelpers';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import { AppealControl } from '@/components/shared/trust/AppealControl';
import { kycService } from '@/services/kycService';
import { trustService, type TrustIdType, type TrustPurpose } from '@/services/trustService';

const ACTIONABLE = ['NOT_STARTED', 'FAILED', 'REVIEW_REQUIRED'];
const IDENTITY_STEP_TYPES = ['NIN_CHECK', 'BVN_CHECK'];
const BIO_STEP_TYPES = ['SELFIE_CAPTURE', 'LIVENESS_CHECK', 'FACE_MATCH'];
const HOST_ONBOARD_PURPOSES: TrustPurpose[] = [
  'LANDLORD_ONBOARDING',
  'PROPERTY_OWNER_ONBOARDING',
  'AGENT_ONBOARDING',
  'PROPERTY_MANAGER_ONBOARDING',
];

interface VerificationCenterProps {
  subjectId: string;
  purpose: TrustPurpose;
  trustScoreHref?: string;
}

export const VerificationCenter = ({
  subjectId,
  purpose,
  trustScoreHref,
}: VerificationCenterProps) => {
  const queryClient = useQueryClient();
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosenIdType, setIdType] = useState<TrustIdType>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneRef, setPhoneRef] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [liveSession, setLiveSession] = useState<SmileLivenessSession | null>(null);
  const [liveJob, setLiveJob] = useState<string | null>(null);
  const [liveUnavailable, setLiveUnavailable] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [documentType, setDocumentType] = useState('AGENT_LICENSE');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentHolder, setDocumentHolder] = useState('');
  const autoStarted = useRef(false);
  const [openStage, setOpenStage] = useState<string | null>(null);

  const invalidateVerification = () => {
    queryClient.invalidateQueries({ queryKey: ['trust-verification', verificationId] });
    queryClient.invalidateQueries({ queryKey: trustKeys.all });
  };

  useRealtimeEvent('verification:decided', () => {
    queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    queryClient.invalidateQueries({ queryKey: ['trust-verification'] });
    queryClient.invalidateQueries({ queryKey: trustKeys.all });
  });

  const { data: kyc } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
  });

  const { data: verification, isLoading: verificationLoading } = useQuery({
    queryKey: ['trust-verification', verificationId],
    queryFn: () => (verificationId ? unwrap(trustService.getVerification(verificationId)) : null),
    enabled: Boolean(verificationId),
    // A provider-decided check (Smile ID's live selfie) lands a little later; look again until it does, as the mobile app does.
    refetchInterval: (q) =>
      q.state.data?.steps?.some((st) => st.status === 'WAITING_FOR_PROVIDER') ? 5000 : false,
  });

  const { data: consents } = useQuery({
    queryKey: ['trust-consents'],
    queryFn: () => unwrap(trustService.listConsents()),
  });
  const idCheckConsent = consents?.find((c) => c.consentType === 'ID_CHECK');
  const bioConsent = consents?.find((c) => c.consentType === 'BIOMETRIC');
  const bankConsent = consents?.find((c) => c.consentType === 'BANK_ACCOUNT_CHECK');
  const docConsent = consents?.find((c) => c.consentType === 'DOCUMENT_PROCESSING');

  const startMutation = useMutation({
    mutationFn: () => unwrap(trustService.startVerification({ subjectId, purpose, country: 'NG' })),
    onSuccess: (v) => {
      setVerificationId(v.id);
      setError(null);
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to load your verification.'),
  });

  // Start is idempotent: it resumes an open verification or creates one.
  useEffect(() => {
    if (
      subjectId &&
      kyc &&
      // Same rule as isVerified below: an account APPROVED while identityVerified is false would otherwise be stuck with nothing started.
      !(kyc.identityVerified ?? kyc.verificationStatus === 'APPROVED') &&
      !autoStarted.current &&
      !startMutation.isPending
    ) {
      autoStarted.current = true;
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, kyc?.verificationStatus, kyc?.identityVerified]);

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

  // A static photo is never accepted here: Smile decides liveness from the live capture, by webhook.
  const liveStart = useMutation({
    mutationFn: () => unwrap(trustService.startLivenessSession(verificationId!)),
    onSuccess: (session) => {
      setError(null);
      setLiveSession(session);
    },
    onError: (reason) => {
      const message = reason instanceof Error ? reason.message : 'The live selfie could not start.';
      if (/not available/i.test(message)) setLiveUnavailable(message);
      else setError(message);
    },
  });

  // While Smile decides, ask the server to check too (the webhook can be slow, and can't reach a local API); it only accepts Smile's answer for the job it issued.
  useEffect(() => {
    if (!liveJob || !verificationId) return;
    let stopped = false;
    let tries = 0;
    const tick = async () => {
      if (stopped) return;
      tries += 1;
      const res = await trustService.checkLiveness(verificationId, liveJob);
      invalidateVerification();
      if (stopped) return;
      if ((res.success && res.data?.status !== 'pending') || tries >= 40) {
        setLiveJob(null);
        return;
      }
      setTimeout(tick, 4000);
    };
    const first = setTimeout(tick, 3000);
    return () => {
      stopped = true;
      clearTimeout(first);
    };
    // invalidateVerification is stable for this verification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveJob, verificationId]);

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
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to run the bank check.'),
  });

  const documentMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.submitDocument(verificationId!, {
          documentType: documentType.trim(),
          documentNumber: documentNumber.trim(),
          holderName: documentHolder.trim() || undefined,
          country: 'NG',
        })
      ),
    onSuccess: () => {
      setDocumentNumber('');
      setDocumentHolder('');
      setError(null);
      invalidateVerification();
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to run the document check.'),
  });

  // Identity specifically: the KYC row's `isVerified` is broader, and the listing and lease gates may still ask for identity.
  const isVerified =
    kyc?.identityVerified ??
    (kyc?.identity?.status === 'APPROVED' || kyc?.verificationStatus === 'APPROVED');
  const steps = verification?.steps ?? [];
  // Only the ID numbers this verification has a check for; offering others would fail.
  const idTypeOptions = (['NIN', 'BVN'] as const).filter((t) =>
    steps.some((s) => s.stepType === `${t}_CHECK`)
  );
  const idType: TrustIdType = idTypeOptions.includes(chosenIdType as 'NIN' | 'BVN')
    ? chosenIdType
    : (idTypeOptions[0] ?? 'NIN');
  const actionable = (status: string) => ACTIONABLE.includes(status);
  const runnableIdentity = steps.find(
    (s) => IDENTITY_STEP_TYPES.includes(s.stepType) && actionable(s.status)
  );
  const runnablePhone = steps.find((s) => s.stepType === 'PHONE_OTP' && actionable(s.status));
  const runnableBio = steps.find(
    (s) => BIO_STEP_TYPES.includes(s.stepType) && actionable(s.status)
  );
  const bankRequired =
    verification !== undefined
      ? steps.some((s) => s.stepType === 'BANK_ACCOUNT_CHECK')
      : HOST_ONBOARD_PURPOSES.includes(purpose);
  const runnableBank = bankRequired
    ? steps.find((s) => s.stepType === 'BANK_ACCOUNT_CHECK' && actionable(s.status))
    : undefined;
  const documentRequired =
    verification !== undefined
      ? steps.some((s) => s.stepType === 'DOCUMENT_CHECK')
      : purpose === 'AGENT_ONBOARDING';
  const runnableDocument = documentRequired
    ? steps.find((s) => s.stepType === 'DOCUMENT_CHECK' && actionable(s.status))
    : undefined;

  const identityEnabled =
    Boolean(runnableIdentity) &&
    Boolean(verificationId) &&
    idNumber.trim().length > 0 &&
    Boolean(idCheckConsent) &&
    !identityMutation.isPending;
  const otpVerifyEnabled =
    Boolean(phoneRef) && otpCode.length === 6 && !verifyOtpMutation.isPending;
  const captureBlocker = liveCaptureBlocker();
  const bankEnabled =
    Boolean(runnableBank) &&
    Boolean(verificationId) &&
    accountNumber.trim().length > 0 &&
    Boolean(bankConsent) &&
    !bankMutation.isPending;
  const documentEnabled =
    Boolean(runnableDocument) &&
    Boolean(verificationId) &&
    documentNumber.trim().length > 0 &&
    Boolean(docConsent) &&
    !documentMutation.isPending;

  type StageStatus = 'done' | 'todo' | 'failed' | 'review' | 'waiting' | 'pending';
  const stageStatus = (types: string[]): StageStatus => {
    const own = steps.filter((s) => types.includes(s.stepType));
    if (!verification || own.length === 0) return 'pending';
    if (own.every((s) => s.status === 'PASSED' || s.status === 'SKIPPED')) return 'done';
    if (own.some((s) => s.status === 'FAILED')) return 'failed';
    if (own.some((s) => s.status === 'REVIEW_REQUIRED')) return 'review';
    if (own.some((s) => s.status === 'WAITING_FOR_PROVIDER' || s.status === 'IN_PROGRESS'))
      return 'waiting';
    return 'todo';
  };
  const consentActive = (c?: { revokedAt?: string }) => Boolean(c && !c.revokedAt);

  const stages: {
    key: string;
    title: string;
    hint: string;
    icon: React.ElementType;
    status: StageStatus;
    needsConsent: boolean;
    body: React.ReactNode;
  }[] = [
    {
      key: 'phone',
      title: 'Confirm your phone number',
      hint: 'A code by SMS. Takes a minute.',
      icon: Smartphone,
      status: stageStatus(['PHONE_OTP']),
      needsConsent: false,
      body: !phoneRef ? (
        <Button
          size="sm"
          icon={<Smartphone className="h-4 w-4" />}
          isLoading={sendOtpMutation.isPending}
          loadingText="Sending…"
          onClick={() => sendOtpMutation.mutate()}
          disabled={!runnablePhone}
        >
          Send code to my phone
        </Button>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code we sent.
            {process.env.NODE_ENV === 'development' &&
              ' In development it is printed to the backend log.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="w-40">
              <NumberInput
                aria-label="Verification code"
                value={otpCode}
                onValueChange={(value) => setOtpCode(value.slice(0, 6))}
                placeholder="6-digit code"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            <Button
              size="sm"
              disabled={!otpVerifyEnabled}
              onClick={() => verifyOtpMutation.mutate()}
              isLoading={verifyOtpMutation.isPending}
              loadingText="Verifying…"
            >
              Verify code
            </Button>
          </div>
        </>
      ),
    },
    {
      key: 'identity',
      title: 'Check your national ID',
      hint: 'Your NIN or BVN, checked against official records. Never shown to other users.',
      icon: Fingerprint,
      status: stageStatus(IDENTITY_STEP_TYPES),
      needsConsent: !consentActive(idCheckConsent),
      body: (
        <>
          <TrustConsentPrompt
            type="ID_CHECK"
            text={
              'We check the number you enter against NIMC/BVN records to confirm it is yours. Nothing is shared with other users.'
            }
            onError={setError}
          />
          {consentActive(idCheckConsent) && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {idTypeOptions.length > 1 && (
                  <Field label="ID type" className="sm:col-span-2">
                    <Select
                      value={idType}
                      onValueChange={(value) => setIdType(value as TrustIdType)}
                      options={idTypeOptions.map((type) => ({ value: type, label: type }))}
                      className="w-full"
                    />
                  </Field>
                )}
                <Field
                  label={
                    idType === 'NIN' ? 'NIN number' : idType === 'BVN' ? 'BVN number' : 'ID number'
                  }
                  className="sm:col-span-2"
                >
                  <Input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder={idType === 'NIN' || idType === 'BVN' ? '11 digits' : 'Number'}
                    className="w-full"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="First name (optional)">
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full"
                  />
                </Field>
                <Field label="Last name (optional)">
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full"
                  />
                </Field>
              </div>
              <Button
                size="sm"
                disabled={!identityEnabled}
                onClick={() => identityMutation.mutate()}
                isLoading={identityMutation.isPending}
                loadingText="Checking…"
              >
                Run identity check
              </Button>
            </>
          )}
        </>
      ),
    },
    {
      key: 'selfie',
      title: 'Take a selfie',
      hint: 'Matched to your ID and checked for liveness, in one step.',
      icon: Camera,
      status: stageStatus(BIO_STEP_TYPES),
      needsConsent: !consentActive(bioConsent),
      body: (
        <>
          <TrustConsentPrompt
            type="BIOMETRIC"
            text={
              'We use the selfie for a liveness check and to match it to your ID, then keep it only for this verification.'
            }
            onError={setError}
          />
          {consentActive(bioConsent) &&
            (liveUnavailable ? (
              <Alert variant="neutral" title="Live selfie temporarily unavailable">
                {liveUnavailable}
              </Alert>
            ) : captureBlocker ? (
              <Alert variant="warning" title="This device can’t take the live selfie">
                {captureBlocker}
              </Alert>
            ) : liveJob ? (
              <p className="text-sm text-muted-foreground" role="status">
                Selfie sent. Smile ID is checking it; this usually takes under a minute.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You’ll look at your camera and follow a short prompt. It confirms you are really
                  there, and a photo can’t be used instead.
                </p>
                <Button
                  size="sm"
                  disabled={!runnableBio}
                  isLoading={liveStart.isPending}
                  loadingText="Starting…"
                  onClick={() => liveStart.mutate()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start live selfie
                </Button>
              </div>
            ))}
        </>
      ),
    },
    ...(bankRequired
      ? [
          {
            key: 'bank',
            title: 'Confirm your bank account',
            hint: 'A name enquiry on the account that receives your payouts. Lifts you to trust tier 3.',
            icon: Landmark,
            status: stageStatus(['BANK_ACCOUNT_CHECK']),
            needsConsent: !consentActive(bankConsent),
            body: (
              <>
                <TrustConsentPrompt
                  type="BANK_ACCOUNT_CHECK"
                  text={
                    'We run a name enquiry with the bank to confirm the account is yours. No money moves.'
                  }
                  onError={setError}
                />
                {consentActive(bankConsent) && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Account number (10 digits)">
                        <NumberInput
                          value={accountNumber}
                          onValueChange={(value) => setAccountNumber(value.slice(0, 10))}
                          placeholder="0123456789"
                          maxLength={10}
                        />
                      </Field>
                      <Field label="Bank" optionalLabel="(optional)">
                        <Select
                          value={bankCode}
                          onValueChange={setBankCode}
                          options={NIGERIAN_BANKS.map((b) => ({ value: b.code, label: b.name }))}
                          placeholder="Choose your bank"
                          searchable
                          searchPlaceholder="Search banks"
                        />
                      </Field>
                      <Field
                        label="Account holder name (optional: compared for a match)"
                        className="sm:col-span-2"
                      >
                        <Input
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="e.g. ACCT HOLDER 6789"
                          className="w-full"
                        />
                      </Field>
                    </div>
                    <Button
                      size="sm"
                      disabled={!bankEnabled}
                      onClick={() => bankMutation.mutate()}
                      isLoading={bankMutation.isPending}
                      loadingText="Checking…"
                    >
                      Run bank check
                    </Button>
                  </>
                )}
              </>
            ),
          },
        ]
      : []),
    ...(documentRequired
      ? [
          {
            key: 'document',
            title: 'Verify your professional document',
            hint: 'Your agent licence or letter of authority, checked with the issuer.',
            icon: FileCheck2,
            status: stageStatus(['DOCUMENT_CHECK']),
            needsConsent: !consentActive(docConsent),
            body: (
              <>
                <TrustConsentPrompt
                  type="DOCUMENT_PROCESSING"
                  text={
                    'We verify the document number with its issuer. Required to finish agent onboarding.'
                  }
                  onError={setError}
                />
                {consentActive(docConsent) && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Document type">
                        <Select
                          value={documentType}
                          onValueChange={(value) => setDocumentType(value)}
                          options={[
                            'AGENT_LICENSE',
                            'CERTIFICATE',
                            'LETTER_OF_AUTHORITY',
                            'PROFESSIONAL_ID',
                          ].map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                          className="w-full"
                        />
                      </Field>
                      <Field label="Document number">
                        <Input
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(e.target.value)}
                          placeholder="e.g. GR-2026-00123"
                          className="w-full"
                        />
                      </Field>
                      <Field
                        label="Holder name (optional: compared for a match)"
                        className="sm:col-span-2"
                      >
                        <Input
                          value={documentHolder}
                          onChange={(e) => setDocumentHolder(e.target.value)}
                          placeholder="e.g. HOLDER 0123"
                          className="w-full"
                        />
                      </Field>
                    </div>
                    <Button
                      size="sm"
                      disabled={!documentEnabled}
                      onClick={() => documentMutation.mutate()}
                      isLoading={documentMutation.isPending}
                      loadingText="Checking…"
                    >
                      Run document check
                    </Button>
                  </>
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  const doneCount = stages.filter((s) => s.status === 'done').length;
  const currentKey =
    stages.find((s) => s.status === 'todo' || s.status === 'failed')?.key ??
    stages.find((s) => s.status === 'review' || s.status === 'waiting')?.key ??
    null;
  const openKey = openStage ?? currentKey;

  const overall: { label: string; variant: BadgeVariant } = isVerified
    ? { label: 'Verified', variant: 'success' }
    : kyc?.verificationStatus === 'REJECTED' || verification?.decision === 'REJECT'
      ? { label: 'Rejected', variant: 'danger' }
      : stages.some((s) => s.status === 'review')
        ? { label: 'In review', variant: 'warning' }
        : stages.some((s) => s.status === 'waiting')
          ? { label: 'Checking…', variant: 'info' }
          : doneCount === 0
            ? { label: 'Not started', variant: 'neutral' }
            : { label: `${doneCount} of ${stages.length} done`, variant: 'primary' };

  const STAGE_CHIP: Record<StageStatus, { label: string; variant: BadgeVariant }> = {
    done: { label: 'Done', variant: 'success' },
    todo: { label: 'Needs you', variant: 'primary' },
    failed: { label: 'Did not pass', variant: 'danger' },
    review: { label: 'In review', variant: 'warning' },
    waiting: { label: 'Checking…', variant: 'info' },
    pending: { label: '', variant: 'neutral' },
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
              <h2 className="text-lg font-bold text-foreground">Your verification</h2>
              <p className="text-sm text-muted-foreground">
                Each check below adds to what you can do on Sureground.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={overall.variant}>{overall.label}</Badge>
            {kyc?.tier !== undefined && (
              <Badge
                variant="primary"
                title={`${TIER_LABELS[kyc.tier] ?? ''}${kyc.trustScore !== undefined ? ` · trust score ${kyc.trustScore}` : ''}`}
              >
                Trust tier {kyc.tier}
              </Badge>
            )}
          </div>
        </div>
        {!isVerified && stages.length > 0 && (
          <div className="mt-4">
            <Progress
              value={doneCount}
              max={stages.length}
              label="Steps done"
              showValue="fraction"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {doneCount === stages.length
                ? 'All steps done. We are finishing the review.'
                : stages.length - doneCount === 1
                  ? '1 step to go. It takes a minute or two.'
                  : `${stages.length - doneCount} steps to go, each takes a minute or two.`}
            </p>
          </div>
        )}
        {kyc?.verificationStatus === 'REJECTED' && (
          <Alert variant="danger" icon={XCircle} className="mt-3">
            Your previous verification was rejected. Please review your details and try again.
          </Alert>
        )}
      </div>

      {error && (
        <Alert
          variant="danger"
          icon={ShieldAlert}
          action={
            /phone number/i.test(error) ? (
              <ChangePhoneButton adding onChanged={() => setError(null)} />
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {isVerified && !verification ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Your identity checks are complete. Nothing more is needed here.
        </p>
      ) : verificationLoading || !verification ? (
        <div role="status" aria-label="Loading" className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
          {!verificationLoading && !startMutation.isPending && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-center text-xs text-muted-foreground">
                Your verification is ready to start.
              </p>
              <Button size="sm" variant="outline" onClick={() => startMutation.mutate()}>
                Start verification
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ol className="space-y-3" aria-label="Verification steps">
          {stages.map((stage, index) => {
            const open = openKey === stage.key && stage.status !== 'done';
            const chip = STAGE_CHIP[stage.status];
            const Icon = stage.icon;
            const bodyId = `verification-stage-${stage.key}`;
            return (
              <li
                key={stage.key}
                className={cn(
                  'rounded-2xl border bg-card',
                  open ? 'border-primary/40' : 'border-border'
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-4 text-left"
                  aria-expanded={open}
                  aria-controls={bodyId}
                  onClick={() => setOpenStage(open ? '' : stage.key)}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                      stage.status === 'done'
                        ? 'bg-success-subtle text-success'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {stage.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {stage.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{stage.hint}</span>
                  </span>
                  {chip.label && (
                    <Badge variant={chip.variant} className="shrink-0">
                      {chip.label}
                    </Badge>
                  )}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      open ? '' : '-rotate-90'
                    )}
                    aria-hidden="true"
                  />
                </button>
                <div id={bodyId} hidden={!open} className="space-y-3 border-t border-border p-4">
                  {stage.status === 'failed' && (
                    <p className="text-xs text-destructive">
                      This check did not pass. Check the details and run it again.
                    </p>
                  )}
                  {stage.status === 'review' && (
                    <p className="text-xs text-warning">
                      A reviewer is looking at this. You can carry on with the other steps.
                    </p>
                  )}
                  {stage.body}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {verification?.decision === 'REJECT' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-destructive">
            This verification was rejected. If you believe this is a mistake, you can appeal it for
            a fresh review.
          </p>
          <AppealControl
            targetType="TRUST_VERIFICATION"
            targetId={verification.id}
            subject="this verification"
          />
        </div>
      )}

      {!isVerified &&
        !steps.some((s) => IDENTITY_STEP_TYPES.includes(s.stepType) && s.status === 'PASSED') && (
          <IdentityDocumentFallback />
        )}

      {trustScoreHref && (
        <div className="grid gap-4 sm:grid-cols-2">
          {
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
          }
        </div>
      )}

      <Dialog open={Boolean(liveSession)} onOpenChange={(open) => !open && setLiveSession(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Live selfie</DialogTitle>
          <DialogDescription>
            Powered by Smile ID. Your camera is used only for this check.
          </DialogDescription>
          {liveSession ? (
            <LiveSelfieCapture
              key={liveSession.userId}
              session={liveSession}
              onSubmitted={(jobId) => {
                setLiveSession(null);
                setLiveJob(jobId);
                invalidateVerification();
              }}
              onCancel={() => setLiveSession(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
