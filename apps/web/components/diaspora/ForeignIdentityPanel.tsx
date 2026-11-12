'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Globe, ShieldAlert } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Field,
  QueryState,
  Select,
  Skeleton,
  Textarea,
  type PendingUpload,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { COUNTRIES } from '@sureground/shared';
import { formatLagosDate } from '@/lib/format';
import { foreignIdentityKeys } from '@/lib/queryKeys';
import { foreignCheckBadges } from '@/lib/statusBadge';
import { foreignIdentityService } from '@/services/foreignIdentityService';
import type { SmileLivenessSession } from '@/services/trustService';
import type { TrustHubExtraTab } from '@/components/shared/trust/TrustHub';
import {
  LiveSelfieCapture,
  liveCaptureBlocker,
} from '@/components/shared/verification/LiveSelfieCapture';
import {
  TrustConsentPrompt,
  useTrustConsents,
} from '@/components/shared/verification/TrustConsentPrompt';
import type { ForeignDocumentStatus, ForeignIdentityStatus } from '@/types/foreignIdentity';

export const FOREIGN_IDENTITY_TAB_ID = 'abroad';

const REVIEW_TIMESCALE = 'Our team reviews it within 2 working days.';
const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic';
const PHOTO_ACCEPT = '.jpg,.jpeg,.png,.webp,.heic';
const MAX_NOTE = 500;

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

const errorText = (reason: unknown, fallback: string) =>
  reason instanceof Error ? reason.message : fallback;
const errorCode = (reason: unknown) => (reason as { code?: string } | null)?.code;

/** The investor's checks abroad; shared by the trust tab and the investor workspace. */
export const useForeignIdentityStatus = () =>
  useQuery({
    queryKey: foreignIdentityKeys.status,
    queryFn: () => unwrap(foreignIdentityService.getStatus()),
    retry: false,
    // A passport result arrives by webhook; look again while one is being checked.
    refetchInterval: (q) => (q.state.data?.passport.state === 'CHECKING' ? 15_000 : false),
  });

/** The "Passport and address abroad" tab for TrustHub: only for investors who can use it. */
export function useForeignIdentityTabs(): TrustHubExtraTab[] {
  const { data } = useForeignIdentityStatus();
  if (!data?.eligible) return [];
  return [
    {
      id: FOREIGN_IDENTITY_TAB_ID,
      label: 'Passport and address abroad',
      icon: Globe,
      description:
        'For Diaspora Invest: your passport, and proof of your address and bank account abroad.',
      content: <ForeignIdentityPanel />,
    },
  ];
}

/** True once the status says this person can use the foreign identity checks. */
export function useForeignIdentityEligible(): boolean {
  return Boolean(useForeignIdentityStatus().data?.eligible);
}

const StatusBadge = ({ status }: { status: ForeignDocumentStatus }) => {
  const entry = foreignCheckBadges[status.state];
  const Icon = entry.icon;
  return (
    <Badge variant={entry.variant} icon={Icon ? <Icon className="h-3.5 w-3.5" /> : undefined}>
      {entry.label}
    </Badge>
  );
};

/** Shown for every state except "send it now". */
const StatusNote = ({ status, what }: { status: ForeignDocumentStatus; what: string }) => {
  if (status.state === 'APPROVED') {
    return <p className="text-sm text-muted-foreground">Your {what} is approved.</p>;
  }
  if (status.state === 'IN_REVIEW') {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Your {what} is with our team.{' '}
        {status.reviewDueAt
          ? `We will reply by ${formatLagosDate(status.reviewDueAt, 'long')}.`
          : 'We reply within 2 working days.'}
      </p>
    );
  }
  if (status.state === 'REJECTED') {
    return (
      <Alert variant="danger" icon={ShieldAlert}>
        Your last {what} was not approved. You can send a new one below.
      </Alert>
    );
  }
  return null;
};

const fileOf = (items: PendingUpload[]) => items[0]?.file ?? null;
const asUploads = (file: File | null, id: string): PendingUpload[] => (file ? [{ id, file }] : []);

// ------------------------------------------------------------------ passport

const PassportCard = ({ status }: { status: ForeignIdentityStatus['passport'] }) => {
  const queryClient = useQueryClient();
  const { isActive } = useTrustConsents();
  const [country, setCountry] = useState('NG');
  const [session, setSession] = useState<SmileLivenessSession | null>(null);
  const [job, setJob] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passport, setPassport] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: foreignIdentityKeys.status });

  const start = useMutation({
    mutationFn: () => unwrap(foreignIdentityService.startPassportSession(country)),
    onSuccess: (next) => {
      setError(null);
      setSession(next);
      refresh();
    },
    onError: (reason) => {
      const code = errorCode(reason);
      // The free check is used, or Smile ID is off: the passport goes to our team instead.
      if (code === 'AUTOMATED_ATTEMPT_USED' || code === 'PASSPORT_CHECK_UNAVAILABLE') {
        setNotice(errorText(reason, 'Send your passport to our team instead.'));
        refresh();
        return;
      }
      setError(errorText(reason, 'The passport check could not start.'));
    },
  });

  const sendForReview = useMutation({
    mutationFn: () =>
      unwrap(
        foreignIdentityService.submitPassportForReview({ passport: passport!, selfie: selfie! })
      ),
    onSuccess: () => {
      setPassport(null);
      setSelfie(null);
      setError(null);
      setNotice(null);
      refresh();
    },
    onError: (reason) => {
      if (errorCode(reason) === 'AUTOMATED_ATTEMPT_AVAILABLE') refresh();
      setError(errorText(reason, 'Your passport could not be sent.'));
    },
  });

  // While Smile decides, ask the server too (the webhook can be slow); same pattern as VerificationCenter.
  useEffect(() => {
    if (!job) return;
    let stopped = false;
    let tries = 0;
    const tick = async () => {
      if (stopped) return;
      tries += 1;
      const res = await foreignIdentityService.checkPassport(job);
      refresh();
      if (stopped) return;
      if ((res.success && res.data?.status !== 'pending') || tries >= 40) {
        setJob(null);
        return;
      }
      setTimeout(tick, 4000);
    };
    const first = setTimeout(tick, 3000);
    return () => {
      stopped = true;
      clearTimeout(first);
    };
    // refresh only invalidates a fixed key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const captureBlocker = liveCaptureBlocker();
  const settled = status.state === 'APPROVED' || status.state === 'IN_REVIEW';
  const automated = status.nextAttempt === 'AUTOMATED';

  let body: React.ReactNode = null;
  if (job) {
    body = (
      <p className="text-sm text-muted-foreground" role="status">
        Sent. Smile ID is checking your passport and selfie; this usually takes a minute or two. If
        it can&apos;t decide, our team reviews it within 2 working days.
      </p>
    );
  } else if (!settled && automated) {
    const ready = isActive('ID_CHECK') && isActive('BIOMETRIC');
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Smile ID reads your passport&apos;s photo page and matches it to a live selfie. Your first
          automatic check is free and starts when the camera opens. If it can&apos;t decide, our
          team reviews it within 2 working days.
        </p>
        <TrustConsentPrompt
          type="ID_CHECK"
          text="We check your passport with Smile ID to confirm it is genuine and in your name."
          onError={setError}
        />
        <TrustConsentPrompt
          type="BIOMETRIC"
          text="We use a live selfie to confirm you are really there and match it to your passport photo, then keep it only for this check."
          onError={setError}
        />
        {ready &&
          (captureBlocker ? (
            <Alert variant="warning" title="This device can’t run the passport check">
              {captureBlocker}
            </Alert>
          ) : (
            <div className="space-y-3">
              <Field label="Country that issued your passport">
                <Select
                  value={country}
                  onValueChange={setCountry}
                  options={COUNTRY_OPTIONS}
                  ariaLabel="Country that issued your passport"
                />
              </Field>
              <Button
                size="sm"
                icon={<Camera className="h-4 w-4" />}
                isLoading={start.isPending}
                loadingText="Starting…"
                onClick={() => start.mutate()}
              >
                Start passport check
              </Button>
            </div>
          ))}
      </div>
    );
  } else if (!settled) {
    const ready = isActive('DOCUMENT_PROCESSING') && isActive('BIOMETRIC');
    body = (
      <div className="space-y-3">
        {status.state === 'CHECKING' && (
          <p className="text-sm text-muted-foreground" role="status">
            If you have just finished the automatic check, its result usually arrives within a few
            minutes. Send your passport to our team only if you closed the camera before the end.
          </p>
        )}
        <Alert variant="info">
          {notice ??
            (status.automatedCheckAvailable
              ? 'You have used your free automatic check.'
              : 'The automatic check is not available right now.')}{' '}
          Send a photo of your passport&apos;s photo page and a selfie, and our team will compare
          them. {REVIEW_TIMESCALE}
        </Alert>
        <TrustConsentPrompt
          type="DOCUMENT_PROCESSING"
          text="We store your passport photo and our team checks it to confirm who you are."
          onError={setError}
        />
        <TrustConsentPrompt
          type="BIOMETRIC"
          text="Our team compares your selfie with your passport photo. We keep it only for this check."
          onError={setError}
        />
        {ready && (
          <>
            <Field label="Passport photo page">
              <DocumentUpload
                checkPhotoQuality
                value={asUploads(passport, 'passport')}
                onChange={(items) => setPassport(fileOf(items))}
                accept={DOCUMENT_ACCEPT}
                capture="environment"
                label=""
                hint="A clear photo or PDF of the page with your photo. Up to 10MB."
              />
            </Field>
            <Field label="Selfie">
              <DocumentUpload
                checkPhotoQuality
                value={asUploads(selfie, 'selfie')}
                onChange={(items) => setSelfie(fileOf(items))}
                accept={PHOTO_ACCEPT}
                capture="user"
                label=""
                hint="A photo of your face, looking at the camera. Up to 10MB."
              />
            </Field>
            <Button
              size="sm"
              disabled={!passport || !selfie}
              isLoading={sendForReview.isPending}
              loadingText="Sending…"
              onClick={() => sendForReview.mutate()}
            >
              Send to our team
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader action={<StatusBadge status={status} />}>
        <CardTitle as="h2">Passport</CardTitle>
        <CardDescription>
          Confirms who you are. It does not check a property, its title or its seller.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusNote status={status} what="passport" />
        {error && (
          <Alert variant="danger" icon={ShieldAlert}>
            {error}
          </Alert>
        )}
        {body}
      </CardContent>

      <Dialog open={Boolean(session)} onOpenChange={(open) => !open && setSession(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Passport check</DialogTitle>
          <DialogDescription>
            Powered by Smile ID. You&apos;ll take a live selfie, then a photo of your
            passport&apos;s photo page. Your camera is used only for this check.
          </DialogDescription>
          {session ? (
            <LiveSelfieCapture
              key={session.userId}
              mode="document"
              session={session}
              onSubmitted={(jobId) => {
                setSession(null);
                setJob(jobId);
                refresh();
              }}
              onCancel={() => {
                setSession(null);
                refresh();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ------------------------------------------- proof of address and bank statement

const DOCUMENTS = {
  address: {
    title: 'Proof of address abroad',
    what: 'proof of address',
    description:
      'A recent document with your name and your address abroad, such as a utility bill or a letter from your bank.',
    consent:
      'We store this document and our team checks it to confirm where you live. Nothing is shared with other users.',
    submit: (file: File, note?: string) => foreignIdentityService.submitAddressProof(file, note),
  },
  bankStatement: {
    title: 'Bank statement from abroad',
    what: 'bank statement',
    description:
      'A recent statement from your bank abroad, showing your name. Once approved it counts towards trust tier 3.',
    consent:
      'We store this statement and our team checks the name and bank on it. We do not use it to move money.',
    submit: (file: File, note?: string) => foreignIdentityService.submitBankStatement(file, note),
  },
} as const;

const ForeignDocumentCard = ({
  kind,
  status,
}: {
  kind: keyof typeof DOCUMENTS;
  status: ForeignDocumentStatus;
}) => {
  const spec = DOCUMENTS[kind];
  const queryClient = useQueryClient();
  const { isActive } = useTrustConsents();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => unwrap(spec.submit(file!, note.trim() || undefined)),
    onSuccess: () => {
      setFile(null);
      setNote('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: foreignIdentityKeys.status });
    },
    onError: (reason) => setError(errorText(reason, `Your ${spec.what} could not be sent.`)),
  });

  const open = status.state !== 'APPROVED' && status.state !== 'IN_REVIEW';

  return (
    <Card>
      <CardHeader action={<StatusBadge status={status} />}>
        <CardTitle as="h2">{spec.title}</CardTitle>
        <CardDescription>{spec.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusNote status={status} what={spec.what} />
        {error && (
          <Alert variant="danger" icon={ShieldAlert}>
            {error}
          </Alert>
        )}
        {open && (
          <>
            <TrustConsentPrompt type="DOCUMENT_PROCESSING" text={spec.consent} onError={setError} />
            {isActive('DOCUMENT_PROCESSING') && (
              <>
                <Field label="Document">
                  <DocumentUpload
                    checkPhotoQuality
                    value={asUploads(file, kind)}
                    onChange={(items) => setFile(fileOf(items))}
                    accept={DOCUMENT_ACCEPT}
                    label=""
                    hint={`PDF or photo, up to 10MB. ${REVIEW_TIMESCALE}`}
                  />
                </Field>
                <Field label="Note for our team" optionalLabel="Optional">
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, MAX_NOTE))}
                    rows={2}
                    maxLength={MAX_NOTE}
                    placeholder="Anything that helps, such as a name that differs from your passport"
                  />
                </Field>
                <Button
                  size="sm"
                  disabled={!file}
                  isLoading={submit.isPending}
                  loadingText="Sending…"
                  onClick={() => submit.mutate()}
                >
                  Send to our team
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ----------------------------------------------------------------------- panel

/** Diaspora investors: a passport checked by Smile ID, and two documents our team reviews. */
export function ForeignIdentityPanel() {
  const status = useForeignIdentityStatus();
  const data = status.data;

  return (
    <QueryState
      isLoading={status.isLoading}
      isError={status.isError}
      onRetry={() => status.refetch()}
      isRetrying={status.isFetching}
      loading={
        <div role="status" aria-label="Loading" className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      }
      isEmpty={Boolean(data && !data.eligible)}
      empty={{
        icon: Globe,
        title:
          data?.ineligibleReason === 'NO_INVESTOR_PROFILE'
            ? 'Complete your investor profile first'
            : 'Not available for your nationality yet',
        description:
          data?.ineligibleReason === 'NO_INVESTOR_PROFILE'
            ? 'These checks are for Diaspora Invest. Set up your investor profile, then come back.'
            : 'Diaspora Invest is open to Nigerians living abroad for now.',
      }}
    >
      {data && (
        <div className="space-y-4">
          <Alert variant="info" title="How these checks work">
            Smile ID checks your passport and a live selfie automatically. Our team reviews your
            proof of address and bank statement within 2 working days, and any passport the
            automatic check can&apos;t decide.
          </Alert>
          <PassportCard status={data.passport} />
          <ForeignDocumentCard kind="address" status={data.address} />
          <ForeignDocumentCard kind="bankStatement" status={data.bankStatement} />
        </div>
      )}
    </QueryState>
  );
}
