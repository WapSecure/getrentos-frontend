import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, FileText, Globe } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import {
  COUNTRIES,
  FOREIGN_CHECK_STATUS,
  formatCurrency,
  formatDualTime,
  SOURCE_OF_FUNDS_SUPPORTING_LABELS,
  SOURCE_OF_FUNDS_WHY,
  type ForeignDocumentStatus,
  type ForeignIdentityStatus,
  type SourceOfFundsStatus,
  type SourceOfFundsSupportingKind,
} from '@sureground/shared';
import { ApiError, errorMessage } from '@/lib/api/client';
import type { PickedFile } from '@/lib/api/documents';
import { foreignIdentityApi, type ForeignDocumentKind } from '@/lib/api/foreignIdentity';
import { deviceTimeZone } from '@/lib/api/landBuyerExtras';
import type { SmileLivenessSession } from '@/lib/api/trust';
import { captureSelfie, pickDocument } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { goBack } from '@/lib/goBack';
import { qk } from '@/lib/query/keys';
import { liveSelfieSupported } from '@/lib/smileid/liveSelfie';
import { useForeignIdentityStatus } from '@/hooks/useForeignIdentityStatus';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { FilePickList, FilePickRow } from '@/components/forms/FilePickRow';
import { SelectField } from '@/components/forms/SelectField';
import { ConsentGate } from '@/components/trust/ConsentGate';
import { LiveSelfieCheck } from '@/components/trust/LiveSelfieCheck';

// Identity abroad for Diaspora Invest (decision D3), as on web: a passport checked by Smile ID with
// a live selfie, and a proof of address and a bank statement our team reviews. Source of funds
// (DIA-07) sits here too.

const REVIEW_TIMESCALE = 'Our team reviews it within 2 working days.';
const MAX_NOTE = 500;
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const codeOf = (e: unknown) => (e instanceof ApiError ? e.code : undefined);

export default function InvestIdentity() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const status = useForeignIdentityStatus();
  const data = status.data;
  const noProfile = data?.ineligibleReason === 'NO_INVESTOR_PROFILE';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <DetailScreenHeader
        eyebrow="Sureground Diaspora Invest"
        title="Identity abroad"
        subtitle="Your passport, address and bank account abroad"
        onBack={() => goBack('/(app)/invest')}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={status.isRefetching}
            onRefresh={() => void status.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={status}
          skeleton={<ListSkeleton rows={3} variant="card" height={140} />}
          isEmpty={!!data && !data.eligible}
          empty={{
            icon: <Globe size={32} color={colors.mutedForeground} />,
            title: noProfile
              ? 'Complete your investor profile first'
              : 'Not available for your nationality yet',
            description: noProfile
              ? 'These checks are for Diaspora Invest. Set up your investor profile, then come back.'
              : 'Diaspora Invest is open to Nigerians living abroad for now.',
          }}
        >
          {data ? (
            <>
              <Text variant="callout" color="mutedForeground">
                Smile ID checks your passport and a live selfie. Our team reviews your proof of
                address and bank statement within 2 working days, and any passport the automatic
                check can’t decide.
              </Text>
              <PassportCard status={data.passport} />
              <DocumentCard kind="address-proof" status={data.address} />
              <DocumentCard kind="bank-statement" status={data.bankStatement} />
              {data.sourceOfFunds ? <SourceOfFundsCard status={data.sourceOfFunds} /> : null}
            </>
          ) : null}
        </QueryState>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CardHead({
  title,
  status,
  note,
}: {
  title: string;
  status: ForeignDocumentStatus;
  note: string;
}) {
  const { spacing } = useTheme();
  const badge = FOREIGN_CHECK_STATUS[status.state];
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Text variant="bodyStrong" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </Text>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
      <Text variant="caption" color="mutedForeground">
        {note}
      </Text>
    </View>
  );
}

/** Shown for every state except "send it now". Business dates stay Lagos dates (D2). */
function StatusNote({ status, what }: { status: ForeignDocumentStatus; what: string }) {
  if (status.state === 'APPROVED') {
    return (
      <Text variant="callout" color="mutedForeground">
        Your {what} is approved.
      </Text>
    );
  }
  if (status.state === 'IN_REVIEW') {
    return (
      <Text variant="callout" color="mutedForeground" accessibilityLiveRegion="polite">
        Your {what} is with our team.{' '}
        {status.reviewDueAt
          ? `We will reply by ${formatDate(status.reviewDueAt)}, ${formatDualTime(status.reviewDueAt, deviceTimeZone())}.`
          : 'We reply within 2 working days.'}
      </Text>
    );
  }
  if (status.state === 'REJECTED') {
    return (
      <FormAlert message={`Your last ${what} was not approved. You can send a new one below.`} />
    );
  }
  return null;
}

function PassportCard({ status }: { status: ForeignIdentityStatus['passport'] }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [country, setCountry] = useState('NG');
  const [session, setSession] = useState<SmileLivenessSession | null>(null);
  const [job, setJob] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passport, setPassport] = useState<PickedFile | null>(null);
  const [selfie, setSelfie] = useState<PickedFile | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: qk.investor.identity });

  const start = useMutation({
    mutationFn: () => foreignIdentityApi.startPassportSession(country),
    onSuccess: (next) => {
      setError(null);
      setSession(next);
      void refresh();
    },
    onError: (e) => {
      const code = codeOf(e);
      // The free check is used, or Smile ID is off: the passport goes to our team instead.
      if (code === 'AUTOMATED_ATTEMPT_USED' || code === 'PASSPORT_CHECK_UNAVAILABLE') {
        setNotice(errorMessage(e, 'Send your passport to our team instead.'));
        void refresh();
        return;
      }
      setError(errorMessage(e, 'The passport check could not start.'));
    },
  });

  const review = useMutation({
    mutationFn: () => foreignIdentityApi.submitPassportForReview(passport!, selfie!),
    onSuccess: () => {
      setPassport(null);
      setSelfie(null);
      setError(null);
      setNotice(null);
      void refresh();
      toast.show('Sent to our team.', 'success');
    },
    onError: (e) => {
      if (codeOf(e) === 'AUTOMATED_ATTEMPT_AVAILABLE') void refresh();
      setError(errorMessage(e, 'Your passport could not be sent.'));
    },
  });

  // While Smile decides, ask the server too (the webhook can be slow), as web does.
  useEffect(() => {
    if (!job) return;
    let stopped = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      tries += 1;
      const res = await foreignIdentityApi.checkPassport(job).catch(() => null);
      void qc.invalidateQueries({ queryKey: qk.investor.identity });
      if (stopped) return;
      if ((res && res.status !== 'pending') || tries >= 40) {
        setJob(null);
        return;
      }
      timer = setTimeout(tick, 4000);
    };
    timer = setTimeout(tick, 3000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [job, qc]);

  const settled = status.state === 'APPROVED' || status.state === 'IN_REVIEW';
  const automated = status.nextAttempt === 'AUTOMATED';

  let body: React.ReactNode = null;
  if (job) {
    body = (
      <Text variant="callout" color="mutedForeground" accessibilityLiveRegion="polite">
        Sent. Smile ID is checking your passport and selfie; this usually takes a minute or two. If
        it can’t decide, our team reviews it within 2 working days.
      </Text>
    );
  } else if (!settled && automated) {
    body = (
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          Smile ID reads your passport’s photo page and matches it to a live selfie. Your first
          automatic check is free. If it can’t decide, our team reviews it within 2 working days.
        </Text>
        <ConsentGate
          types={['ID_CHECK', 'BIOMETRIC']}
          text={{
            ID_CHECK:
              'We check your passport with Smile ID to confirm it is genuine and in your name.',
            BIOMETRIC:
              'We use a live selfie to confirm you are really there and match it to your passport photo, then keep it only for this check.',
          }}
        >
          {liveSelfieSupported() ? (
            <View style={{ gap: spacing.md }}>
              <SelectField
                label="Country that issued your passport"
                value={country}
                options={COUNTRY_OPTIONS}
                onChange={setCountry}
              />
              <Button
                label="Start passport check"
                icon={<Camera size={16} color={colors.primaryForeground} />}
                loading={start.isPending}
                loadingLabel="Starting…"
                onPress={() => start.mutate()}
              />
            </View>
          ) : (
            <FormAlert
              tone="warning"
              title="This device can’t run the passport check"
              message="Use the latest Sureground app on your phone, or do the check on the website."
            />
          )}
        </ConsentGate>
      </View>
    );
  } else if (!settled) {
    body = (
      <View style={{ gap: spacing.md }}>
        {status.state === 'CHECKING' ? (
          <Text variant="callout" color="mutedForeground" accessibilityLiveRegion="polite">
            If you have just finished the automatic check, its result usually arrives within a few
            minutes. Send your passport to our team only if you closed the camera before the end.
          </Text>
        ) : null}
        <FormAlert
          tone="info"
          message={`${
            notice ??
            (status.automatedCheckAvailable
              ? 'You have used your free automatic check.'
              : 'The automatic check is not available right now.')
          } Send a photo of your passport’s photo page and a selfie, and our team will compare them. ${REVIEW_TIMESCALE}`}
        />
        <ConsentGate
          types={['DOCUMENT_PROCESSING', 'BIOMETRIC']}
          text={{
            DOCUMENT_PROCESSING:
              'We store your passport photo and our team checks it to confirm who you are.',
            BIOMETRIC:
              'Our team compares your selfie with your passport photo. We keep it only for this check.',
          }}
        >
          <View style={{ gap: spacing.md }}>
            <FilePickRow
              checkPhotoQuality
              label="Passport photo page"
              file={passport}
              icon={FileText}
              emptyText="A clear photo or PDF of the page with your photo"
              onPick={async () => setPassport(await pickDocument())}
              onClear={() => setPassport(null)}
            />
            <FilePickRow
              checkPhotoQuality
              label="Selfie"
              file={selfie}
              icon={Camera}
              emptyText="Take a photo of your face"
              onPick={async () => setSelfie(await captureSelfie())}
              onClear={() => setSelfie(null)}
            />
            <Button
              label="Send to our team"
              loading={review.isPending}
              loadingLabel="Sending…"
              disabled={!passport || !selfie}
              onPress={() => review.mutate()}
            />
          </View>
        </ConsentGate>
      </View>
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <CardHead
        title="Passport"
        status={status}
        note="Confirms who you are. It does not check a property, its title or its seller."
      />
      <StatusNote status={status} what="passport" />
      {error ? <FormAlert message={error} /> : null}
      {body}
      {session ? (
        <LiveSelfieCheck
          mode="document"
          session={session}
          onClose={(outcome, jobId) => {
            setSession(null);
            void refresh();
            if (outcome && !outcome.submitted) toast.show(outcome.text, outcome.tone);
            if (outcome?.submitted && jobId) setJob(jobId);
          }}
        />
      ) : null}
    </Card>
  );
}

const DOCUMENTS: Record<
  ForeignDocumentKind,
  { title: string; what: string; description: string; consent: string }
> = {
  'address-proof': {
    title: 'Proof of address abroad',
    what: 'proof of address',
    description:
      'A recent document with your name and your address abroad, such as a utility bill or a letter from your bank.',
    consent:
      'We store this document and our team checks it to confirm where you live. Nothing is shared with other users.',
  },
  'bank-statement': {
    title: 'Bank statement from abroad',
    what: 'bank statement',
    description:
      'A recent statement from your bank abroad, showing your name. Once approved it counts towards trust tier 3.',
    consent:
      'We store this statement and our team checks the name and bank on it. We do not use it to move money.',
  },
};

function DocumentCard({
  kind,
  status,
}: {
  kind: ForeignDocumentKind;
  status: ForeignDocumentStatus;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const spec = DOCUMENTS[kind];
  const [file, setFile] = useState<PickedFile | null>(null);
  const [note, setNote] = useState('');
  const submit = useMutation({
    mutationFn: () => foreignIdentityApi.submitDocument(kind, file!, note.trim() || undefined),
    onSuccess: () => {
      setFile(null);
      setNote('');
      void qc.invalidateQueries({ queryKey: qk.investor.identity });
      toast.show('Sent to our team.', 'success');
    },
  });
  const open = status.state !== 'APPROVED' && status.state !== 'IN_REVIEW';

  return (
    <Card style={{ gap: spacing.md }}>
      <CardHead title={spec.title} status={status} note={spec.description} />
      <StatusNote status={status} what={spec.what} />
      {submit.isError ? (
        <FormAlert message={errorMessage(submit.error, `Your ${spec.what} could not be sent.`)} />
      ) : null}
      {open ? (
        <ConsentGate types={['DOCUMENT_PROCESSING']} text={{ DOCUMENT_PROCESSING: spec.consent }}>
          <View style={{ gap: spacing.md }}>
            <FilePickRow
              checkPhotoQuality
              label="Document"
              file={file}
              emptyText={`PDF or photo. ${REVIEW_TIMESCALE}`}
              onPick={async () => setFile(await pickDocument())}
              onClear={() => setFile(null)}
            />
            <TextField
              label="Note for our team (optional)"
              value={note}
              onChangeText={setNote}
              maxLength={MAX_NOTE}
              multiline
              placeholder="Anything that helps, such as a name that differs from your passport"
            />
            <Button
              label="Send to our team"
              loading={submit.isPending}
              loadingLabel="Sending…"
              disabled={!file}
              onPress={() => submit.mutate()}
            />
          </View>
        </ConsentGate>
      ) : null}
    </Card>
  );
}

const SUPPORTING_OPTIONS = (
  Object.keys(SOURCE_OF_FUNDS_SUPPORTING_LABELS) as SourceOfFundsSupportingKind[]
).map((value) => ({ value, label: SOURCE_OF_FUNDS_SUPPORTING_LABELS[value] }));

/** The backend's limits, as on web. */
const MAX_BANK_STATEMENTS = 6;
const MAX_SUPPORTING = 5;

/** DIA-07: asked above the D4 thresholds before an offer or deposit; reviewed like the documents above. */
function SourceOfFundsCard({ status }: { status: SourceOfFundsStatus }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [statements, setStatements] = useState<PickedFile[]>([]);
  const [kind, setKind] = useState<SourceOfFundsSupportingKind>('PAYSLIPS');
  const [supporting, setSupporting] = useState<PickedFile[]>([]);
  const [donor, setDonor] = useState<PickedFile | null>(null);
  const [note, setNote] = useState('');
  const needsDonor = kind === 'INHERITANCE_OR_GIFT_LETTER';
  const submit = useMutation({
    mutationFn: () =>
      foreignIdentityApi.submitSourceOfFunds({
        bankStatements: statements,
        supportingKind: kind,
        supporting,
        donorIdentity: needsDonor ? donor : null,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      setStatements([]);
      setSupporting([]);
      setDonor(null);
      setNote('');
      void qc.invalidateQueries({ queryKey: qk.investor.identity });
      toast.show('Sent to our team.', 'success');
    },
  });
  const open = status.state !== 'APPROVED' && status.state !== 'IN_REVIEW';
  const { singlePurchaseNaira, totalCommittedNaira } = status.thresholds;

  return (
    <Card style={{ gap: spacing.md }}>
      <CardHead title="Source of funds" status={status} note={status.why || SOURCE_OF_FUNDS_WHY} />
      <StatusNote status={status} what="source of funds check" />
      {open ? (
        <Text variant="callout" color="mutedForeground">
          {status.required
            ? 'Needed before your next offer or deposit.'
            : `We ask for this when one purchase is ${formatCurrency(singlePurchaseNaira, { compact: true })} or more, or your purchases pass ${formatCurrency(totalCommittedNaira, { compact: true })} in total. You can send it now.`}
        </Text>
      ) : null}
      {submit.isError ? (
        <FormAlert
          message={errorMessage(submit.error, 'Your source of funds documents could not be sent.')}
        />
      ) : null}
      {open ? (
        <ConsentGate
          types={['DOCUMENT_PROCESSING']}
          text={{
            DOCUMENT_PROCESSING:
              'We store these documents and our team checks where the money comes from. We do not use them to move money.',
          }}
        >
          <View style={{ gap: spacing.md }}>
            <FilePickList
              label={`Bank statements for the last ${status.bankStatementMonths} months`}
              files={statements}
              max={MAX_BANK_STATEMENTS}
              onChange={setStatements}
              pick={pickDocument}
              emptyText="PDF or photo, from the account the money will come from"
              addText="Add another statement"
            />
            <SelectField
              label="Supporting document"
              value={kind}
              options={SUPPORTING_OPTIONS}
              onChange={(value) => setKind(value as SourceOfFundsSupportingKind)}
            />
            <FilePickList
              label={SOURCE_OF_FUNDS_SUPPORTING_LABELS[kind]}
              files={supporting}
              max={MAX_SUPPORTING}
              onChange={setSupporting}
              pick={pickDocument}
              emptyText="PDF or photo"
            />
            {needsDonor ? (
              <FilePickRow
                label="Donor’s identity document"
                file={donor}
                emptyText="Passport or national ID of the person who gave or left you the money"
                onPick={async () => setDonor(await pickDocument())}
                onClear={() => setDonor(null)}
              />
            ) : null}
            <TextField
              label="Note for our team (optional)"
              value={note}
              onChangeText={setNote}
              maxLength={MAX_NOTE}
              multiline
              placeholder="Anything that helps, such as how the money was saved"
            />
            <Button
              label="Send to our team"
              loading={submit.isPending}
              loadingLabel="Sending…"
              disabled={!statements.length || !supporting.length || (needsDonor && !donor)}
              onPress={() => submit.mutate()}
            />
          </View>
        </ConsentGate>
      ) : null}
    </Card>
  );
}
