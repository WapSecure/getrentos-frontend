import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle2, Gavel } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  NumberField,
  OtpInput,
  PressableScale,
  Progress,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  activeConsent,
  APPEAL_STATUS,
  CONSENT_COPY,
  CONSENT_FOR,
  checkKinds,
  checkState,
  idNumberOk,
  PROFESSIONAL_DOCUMENT_TYPES,
  TRUST_ID_TYPES,
  trustApi,
  type CheckKind,
  type CheckState,
  type ConsentType,
  type TrustConsent,
  type TrustIdType,
  type TrustPurpose,
  type SmileLivenessSession,
} from '@/lib/api/trust';
import { liveSelfieSupported } from '@/lib/smileid/liveSelfie';
import { LiveSelfieCheck } from './LiveSelfieCheck';
import { ApiError, errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { BankAccountFields, accountNumberOk } from '@/components/forms/BankAccountFields';

/**
 * The instant identity checks (phone code, NIN/BVN, selfie, bank account,
 * professional document) the trust orchestrator asks for, with the consent each
 * one needs. Starting is idempotent: it resumes the open verification.
 */
export function VerificationChecklist({
  subjectId,
  purpose,
}: {
  subjectId: string;
  purpose: TrustPurpose;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const [verificationId, setVerificationId] = useState<string | null>(null);
  // undefined: follow the next check that needs the person; null: all folded.
  const [opened, setOpened] = useState<CheckKind | null | undefined>(undefined);
  const started = useRef(false);
  const start = useMutation({
    mutationFn: () => trustApi.start(subjectId, purpose),
    onSuccess: (v) => setVerificationId(v.id),
  });
  useEffect(() => {
    if (!subjectId || started.current) return;
    started.current = true;
    start.mutate();
    // start is stable enough: run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const detail = useQuery({
    queryKey: qk.trust.verification(verificationId ?? ''),
    queryFn: () => trustApi.verification(verificationId!),
    enabled: !!verificationId,
    // A live selfie is decided by Smile on the server a little later; look again until it lands.
    refetchInterval: (q) =>
      q.state.data?.steps?.some((st) => st.status === 'WAITING_FOR_PROVIDER') ? 5000 : false,
  });
  const consents = useQuery({ queryKey: qk.trust.consents, queryFn: trustApi.consents });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.trust.verification(verificationId ?? '') });
    qc.invalidateQueries({ queryKey: ['kyc-status'] });
  };

  if (start.isError) {
    return (
      <Card style={{ gap: spacing.sm }}>
        <Text variant="callout">{errorMessage(start.error, 'Could not load your checks.')}</Text>
        <Button
          label="Try again"
          size="sm"
          variant="secondary"
          onPress={() => start.mutate()}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>
    );
  }
  if (!detail.data) return <Skeleton height={180} />;

  const v = detail.data;
  const kinds = checkKinds(v.steps);
  const states = kinds.map((k) => checkState(v.steps, k));
  const done = states.filter((st) => st === 'done').length;
  // The first check that needs the person opens; the rest fold to one line.
  const current =
    kinds.find((_, i) => states[i] === 'todo' || states[i] === 'failed') ??
    kinds.find((_, i) => states[i] === 'review' || states[i] === 'waiting') ??
    null;
  const openKind = opened === undefined ? current : opened;
  return (
    <View style={{ gap: spacing.md }}>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="heading" style={{ flex: 1 }}>
            Your checks
          </Text>
          <Text variant="caption" color="mutedForeground">
            {done} of {kinds.length} done
          </Text>
        </View>
        <Progress
          value={kinds.length ? done / kinds.length : 0}
          accessibilityLabel={`${done} of ${kinds.length} checks done`}
        />
      </Card>

      {kinds.map((kind, i) => (
        <CheckStage
          key={kind}
          index={i + 1}
          kind={kind}
          state={states[i]}
          open={openKind === kind && states[i] !== 'done'}
          onToggle={() => setOpened(openKind === kind ? null : kind)}
        >
          {states[i] === 'todo' || states[i] === 'failed' ? (
            <CheckRunner
              kind={kind}
              verificationId={v.id}
              consents={consents.data}
              onDone={() => {
                setOpened(undefined);
                refresh();
              }}
            />
          ) : (
            <Text variant="callout" color="mutedForeground">
              {states[i] === 'review'
                ? 'A reviewer is looking at this. You can carry on with the other checks.'
                : 'We are checking this now.'}
            </Text>
          )}
        </CheckStage>
      ))}

      {v.decision === 'REJECT' ? <AppealCard verificationId={v.id} /> : null}

      <ConsentList consents={consents.data} />
    </View>
  );
}

const STATE_BADGE: Record<
  CheckState,
  { label: string; tone: 'success' | 'info' | 'danger' | 'warning' | 'neutral' }
> = {
  done: { label: 'Done', tone: 'success' },
  todo: { label: 'Needs you', tone: 'info' },
  failed: { label: 'Did not pass', tone: 'danger' },
  review: { label: 'In review', tone: 'warning' },
  waiting: { label: 'Checking', tone: 'neutral' },
};

/** One numbered check: a line that opens to its form when it needs the person. */
function CheckStage({
  index,
  kind,
  state,
  open,
  onToggle,
  children,
}: {
  index: number;
  kind: CheckKind;
  state: CheckState;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { colors, spacing, radius } = useTheme();
  const badge = STATE_BADGE[state];
  return (
    <Card padding="none" style={{ overflow: 'hidden' }}>
      <PressableScale
        onPress={state === 'done' ? undefined : onToggle}
        disabled={state === 'done'}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled: state === 'done' }}
        accessibilityLabel={`Step ${index}: ${RUNNER_TITLE[kind]}, ${badge.label}`}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: state === 'done' ? colors.successSubtle : colors.accent,
            }}
          >
            {state === 'done' ? (
              <CheckCircle2 size={16} color={colors.success} />
            ) : (
              <Text variant="label" color="primary">
                {index}
              </Text>
            )}
          </View>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {RUNNER_TITLE[kind]}
          </Text>
          <Badge label={badge.label} tone={badge.tone} />
        </View>
      </PressableScale>
      {open ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>{children}</View>
      ) : null}
    </Card>
  );
}

const RUNNER_TITLE: Record<CheckKind, string> = {
  identity: 'Check your ID number',
  phone: 'Confirm your phone number',
  biometric: 'Take a selfie',
  bank: 'Confirm your bank account',
  document: 'Check a professional document',
};

function CheckRunner({
  kind,
  verificationId,
  consents,
  onDone,
}: {
  kind: CheckKind;
  verificationId: string;
  consents: TrustConsent[] | undefined;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [now] = useState(() => Date.now());
  const consentType = CONSENT_FOR[kind];
  const consented = consentType ? !!activeConsent(consents, consentType, now) : true;
  const grant = useMutation({
    mutationFn: (type: ConsentType) => trustApi.grantConsent(type),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trust.consents }),
    onError: (e) => toast.show(errorMessage(e, 'Could not record your consent.'), 'error'),
  });
  // The numbered line above already names the check, so no title or card here.
  return (
    <View style={{ gap: spacing.md }}>
      {consentType && !consented ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" color="mutedForeground">
            {CONSENT_COPY[consentType].body}
          </Text>
          <Button
            label="I agree, continue"
            size="sm"
            loading={grant.isPending}
            onPress={() => grant.mutate(consentType)}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
      ) : kind === 'identity' ? (
        <IdentityForm verificationId={verificationId} onDone={onDone} />
      ) : kind === 'phone' ? (
        <PhoneForm verificationId={verificationId} onDone={onDone} />
      ) : kind === 'biometric' ? (
        <SelfieForm verificationId={verificationId} onDone={onDone} />
      ) : kind === 'bank' ? (
        <BankForm verificationId={verificationId} onDone={onDone} />
      ) : (
        <DocumentForm verificationId={verificationId} onDone={onDone} />
      )}
    </View>
  );
}

type FormProps = { verificationId: string; onDone: () => void };

/** The step result text for a check that ran but did not pass. */
function outcomeToast(status: string | undefined, passed: string) {
  if (status === 'PASSED') return { text: passed, tone: 'success' as const };
  if (status === 'REVIEW_REQUIRED')
    return { text: 'Sent for a person to review. We will let you know.', tone: 'info' as const };
  return { text: 'That did not match. Check the details and try again.', tone: 'error' as const };
}

function IdentityForm({ verificationId, onDone }: FormProps) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [idType, setIdType] = useState<TrustIdType>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const run = useMutation({
    mutationFn: () =>
      trustApi.identity(verificationId, {
        idType,
        idNumber: idNumber.trim(),
        ...(firstName.trim() ? { firstName: firstName.trim() } : {}),
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
      }),
    onSuccess: (r) => {
      const o = outcomeToast(r.status, 'Your ID is confirmed.');
      toast.show(o.text, o.tone);
      if (r.status === 'PASSED') setIdNumber('');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not run that check.'), 'error'),
  });
  const numeric = idType === 'NIN' || idType === 'BVN';
  return (
    <View style={{ gap: spacing.md }}>
      <ChipSelect
        label="ID type"
        options={TRUST_ID_TYPES}
        value={idType}
        onChange={(v) => {
          setIdType(v as TrustIdType);
          setIdNumber('');
        }}
      />
      {numeric ? (
        <NumberField
          label={`${idType} (11 digits)`}
          value={idNumber}
          onValueChange={setIdNumber}
          code
          maxLength={11}
        />
      ) : (
        <TextField
          label="ID number"
          value={idNumber}
          onChangeText={setIdNumber}
          autoCapitalize="characters"
        />
      )}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TextField
          label="First name"
          optional
          value={firstName}
          onChangeText={setFirstName}
          containerStyle={{ flex: 1 }}
        />
        <TextField
          label="Last name"
          optional
          value={lastName}
          onChangeText={setLastName}
          containerStyle={{ flex: 1 }}
        />
      </View>
      <Button
        label="Run the check"
        loading={run.isPending}
        disabled={!idNumberOk(idType, idNumber) || run.isPending}
        onPress={() => run.mutate()}
      />
    </View>
  );
}

function PhoneForm({ verificationId, onDone }: FormProps) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [reference, setReference] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const send = useMutation({
    mutationFn: () => trustApi.sendPhoneCode(verificationId),
    onSuccess: (r) => {
      setReference(r.reference);
      toast.show('Code sent by SMS.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send the code.'), 'error'),
  });
  const verify = useMutation({
    mutationFn: () => trustApi.verifyPhoneCode(verificationId, reference!, code),
    onSuccess: () => {
      toast.show('Phone number confirmed.', 'success');
      setReference(null);
      setCode('');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'That code did not work.'), 'error'),
  });
  if (!reference) {
    return (
      <Button
        label="Text me a code"
        size="sm"
        loading={send.isPending}
        onPress={() => send.mutate()}
        style={{ alignSelf: 'flex-start' }}
      />
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground">
        Enter the 6-digit code we texted you.
      </Text>
      <OtpInput value={code} onChange={setCode} length={6} autoFocus />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          label="Confirm"
          size="sm"
          loading={verify.isPending}
          disabled={code.length !== 6 || verify.isPending}
          onPress={() => verify.mutate()}
        />
        <Button
          label="Send a new code"
          size="sm"
          variant="ghost"
          disabled={send.isPending}
          onPress={() => send.mutate()}
        />
      </View>
    </View>
  );
}

function SelfieForm({ verificationId, onDone }: FormProps) {
  const { spacing } = useTheme();
  const toast = useToast();
  // Smile ID's live check needs its native code (a development or store build).
  // There is no photo fallback: a photo cannot show someone is present (ID-08).
  const supported = liveSelfieSupported;
  const [unavailable, setUnavailable] = useState(false);
  const [session, setSession] = useState<SmileLivenessSession | null>(null);
  const startLive = useMutation({
    mutationFn: () => trustApi.livenessSession(verificationId),
    onSuccess: setSession,
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'LIVENESS_UNAVAILABLE') setUnavailable(true);
      toast.show(errorMessage(e, 'Could not start the live selfie check.'), 'error');
    },
  });

  if (!supported) {
    return (
      <Text variant="caption" color="mutedForeground">
        The live selfie needs the Sureground app from the App Store or Google Play. It can&apos;t
        run here.
      </Text>
    );
  }
  if (unavailable) {
    return (
      <Text variant="caption" color="mutedForeground">
        Live selfie checks are temporarily unavailable. Please try again later.
      </Text>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" color="mutedForeground">
        A short live selfie: face the camera in good light and turn your head when asked. It
        confirms you are really there and matches your face to your ID.
      </Text>
      <Button
        label="Start live selfie"
        size="sm"
        icon={<Camera size={16} />}
        loading={startLive.isPending}
        onPress={() => startLive.mutate()}
        style={{ alignSelf: 'flex-start' }}
      />
      {session ? (
        <LiveSelfieCheck
          session={session}
          onClose={(outcome) => {
            setSession(null);
            if (outcome) toast.show(outcome.text, outcome.tone);
            if (outcome?.submitted) onDone();
          }}
        />
      ) : null}
    </View>
  );
}

function BankForm({ verificationId, onDone }: FormProps) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const run = useMutation({
    mutationFn: () =>
      trustApi.bank(verificationId, {
        accountNumber,
        ...(bankCode ? { bankCode } : {}),
        ...(accountName.trim() ? { accountName: accountName.trim() } : {}),
      }),
    onSuccess: (r) => {
      const o = outcomeToast(r.status, 'Bank account confirmed. You are now Trust tier 3.');
      toast.show(o.text, o.tone);
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not run the bank check.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.md }}>
      <BankAccountFields
        bankCode={bankCode}
        onBankCode={setBankCode}
        accountNumber={accountNumber}
        onAccountNumber={setAccountNumber}
      />
      <TextField
        label="Account name"
        optional
        hint="We compare it with the name the bank holds."
        value={accountName}
        onChangeText={setAccountName}
      />
      <Button
        label="Run the check"
        loading={run.isPending}
        disabled={!accountNumberOk(accountNumber) || run.isPending}
        onPress={() => run.mutate()}
      />
    </View>
  );
}

function DocumentForm({ verificationId, onDone }: FormProps) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [documentType, setDocumentType] = useState('AGENT_LICENSE');
  const [documentNumber, setDocumentNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const run = useMutation({
    mutationFn: () =>
      trustApi.document(verificationId, {
        documentType,
        documentNumber: documentNumber.trim(),
        ...(holderName.trim() ? { holderName: holderName.trim() } : {}),
      }),
    onSuccess: (r) => {
      const o = outcomeToast(r.status, 'Document confirmed.');
      toast.show(o.text, o.tone);
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not run the document check.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.md }}>
      <ChipSelect
        label="Document"
        options={PROFESSIONAL_DOCUMENT_TYPES}
        value={documentType}
        onChange={setDocumentType}
      />
      <TextField
        label="Document number"
        value={documentNumber}
        onChangeText={setDocumentNumber}
        autoCapitalize="characters"
      />
      <TextField
        label="Name on the document"
        optional
        value={holderName}
        onChangeText={setHolderName}
      />
      <Button
        label="Run the check"
        loading={run.isPending}
        disabled={!documentNumber.trim() || run.isPending}
        onPress={() => run.mutate()}
      />
    </View>
  );
}

function AppealCard({ verificationId }: { verificationId: string }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const appeals = useQuery({ queryKey: qk.trust.appeals, queryFn: trustApi.myAppeals });
  const file = useMutation({
    mutationFn: () => trustApi.appeal(verificationId, reason.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.trust.appeals });
      setOpen(false);
      setReason('');
      toast.show('Appeal sent. An officer will review it.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send your appeal.'), 'error'),
  });
  const existing = appeals.data?.find(
    (a) => a.targetType === 'TRUST_VERIFICATION' && a.targetId === verificationId
  );
  return (
    <Card style={{ gap: spacing.sm, borderColor: colors.destructive, borderWidth: 1 }}>
      <Text variant="bodyStrong">This verification was rejected</Text>
      {appeals.isLoading ? null : existing ? (
        <>
          <Text variant="callout">{APPEAL_STATUS[existing.status]}</Text>
          {existing.resolution ? (
            <Text variant="caption" color="mutedForeground">
              Officer: {existing.resolution}
            </Text>
          ) : null}
        </>
      ) : open ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label="Why should it be looked at again?"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={2000}
            hint="At least 10 characters."
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Send appeal"
              size="sm"
              loading={file.isPending}
              disabled={reason.trim().length < 10 || file.isPending}
              onPress={() => file.mutate()}
            />
            <Button label="Back" size="sm" variant="ghost" onPress={() => setOpen(false)} />
          </View>
        </View>
      ) : (
        <>
          <Text variant="callout" color="mutedForeground">
            If you think this is a mistake, appeal it and someone else will review it.
          </Text>
          <Button
            label="Appeal this decision"
            size="sm"
            variant="secondary"
            icon={<Gavel size={16} />}
            onPress={() => setOpen(true)}
            style={{ alignSelf: 'flex-start' }}
          />
        </>
      )}
    </Card>
  );
}

/** Consents in force, each revocable. */
function ConsentList({ consents }: { consents: TrustConsent[] | undefined }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [now] = useState(() => Date.now());
  const revoke = useMutation({
    mutationFn: (id: string) => trustApi.revokeConsent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.trust.consents });
      toast.show('Consent withdrawn.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw your consent.'), 'error'),
  });
  const active = (Object.keys(CONSENT_COPY) as ConsentType[])
    .map((t) => activeConsent(consents, t, now))
    .filter((c): c is TrustConsent => !!c);
  if (active.length === 0) return null;
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Consents you have given</Text>
      {active.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="callout">{CONSENT_COPY[c.consentType as ConsentType].title}</Text>
            <Text variant="caption" color="mutedForeground">
              Given {formatDate(c.grantedAt, 'short')}
            </Text>
          </View>
          <Button
            label="Withdraw"
            size="sm"
            variant="ghost"
            loading={revoke.isPending && revoke.variables === c.id}
            disabled={revoke.isPending}
            onPress={() => revoke.mutate(c.id)}
          />
        </View>
      ))}
    </Card>
  );
}
