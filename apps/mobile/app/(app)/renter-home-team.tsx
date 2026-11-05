import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, BadgeCheck, CheckCircle2, ShieldAlert, Users } from 'lucide-react-native';
import {
  Button,
  Card,
  Checkbox,
  CurrencyField,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  CONTACT_KINDS,
  IMPERSONATION_CHANNELS,
  renterHomeApi,
  reportReady,
  type ContactKind,
  type ContactVerdict,
  type HomeTeam,
  type ImpersonationChannel,
} from '@/lib/api/renterHome';
import { ApiError } from '@/lib/api/client';
import { SUPPORT, hasSupportLine } from '@/lib/support';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * Who really manages the tenant's home and how to spot an impostor: the
 * verified landlord and managers, a check for any number, email or account
 * someone used, and a report that reaches GetRentos and the real landlord.
 */
export default function RenterHomeTeam() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: qk.renter.homeTeam, queryFn: renterHomeApi.homeTeam });
  const homes = q.data ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Your home"
        title="Who manages your home"
        subtitle="Check anyone who contacts you"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {q.isLoading ? (
          <ListSkeleton rows={2} variant="card" height={120} />
        ) : q.isError ? (
          <ErrorState onRetry={() => q.refetch()} />
        ) : homes.length === 0 ? (
          <EmptyState
            icon={<Users size={32} color={colors.mutedForeground} />}
            title="No home yet"
            description="Once you have a lease, the people verified to manage it show here."
          />
        ) : (
          <>
            <Text variant="callout" color="mutedForeground">
              These are the only people verified to act for your home. Anyone else claiming to be
              your landlord, a new manager or GetRentos is not.
            </Text>
            {homes.map((h) => (
              <HomeCard key={h.leaseId} home={h} />
            ))}
            <PayRule />
            <ContactCheck />
            <ImpostorReport homes={homes} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function HomeCard({ home: h }: { home: HomeTeam }) {
  const { colors, spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">
        {h.propertyTitle}
        {h.managedBy ? (
          <Text variant="callout" color="mutedForeground">
            {' '}
            · managed by {h.managedBy}
          </Text>
        ) : null}
      </Text>
      {h.people.map((p) => (
        <View
          key={`${p.name}-${p.role}`}
          style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}
        >
          <BadgeCheck size={16} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text variant="callout" style={{ fontWeight: '600' }}>
              {p.name}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {p.role}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {[p.phone && `Phone ${p.phone}`, p.email].filter(Boolean).join(' · ') ||
                'Reach them in Messages'}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

function PayRule() {
  const { colors, spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.xs, borderColor: colors.primary, borderWidth: 1 }}>
      <Text variant="bodyStrong">Pay rent only in GetRentos</Text>
      <Text variant="callout" color="mutedForeground">
        GetRentos never asks you to pay into a personal account, and a change of manager never
        changes how you pay.
        {hasSupportLine()
          ? ` GetRentos support only contacts you from ${[SUPPORT.phone, SUPPORT.whatsapp]
              .filter(Boolean)
              .join(' or ')}.`
          : ''}
      </Text>
      <Button
        label="Go to payments"
        size="sm"
        variant="ghost"
        onPress={() => router.push('/(app)/lease')}
        style={{ alignSelf: 'flex-start' }}
      />
    </Card>
  );
}

function ContactCheck() {
  const { spacing } = useTheme();
  const [kind, setKind] = useState<ContactKind>('PHONE');
  const [value, setValue] = useState('');
  const check = useMutation({
    mutationFn: () => renterHomeApi.checkContact(kind, value.trim()),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">Check a contact</Text>
        <Text variant="caption" color="mutedForeground">
          Someone called, messaged or sent account details? Check them before you do anything.
        </Text>
      </View>
      <ChipSelect
        label="What to check"
        options={CONTACT_KINDS}
        value={kind}
        onChange={(v) => {
          setKind(v);
          setValue('');
          check.reset();
        }}
      />
      <TextField
        label={CONTACT_KINDS.find((k) => k.value === kind)!.label}
        placeholder={
          kind === 'EMAIL' ? 'name@example.com' : kind === 'PHONE' ? '0803 123 4567' : '0123456789'
        }
        value={value}
        onChangeText={(t) => {
          setValue(t);
          if (check.data) check.reset();
        }}
        keyboardType={kind === 'EMAIL' ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
      />
      <Button
        label="Check"
        loading={check.isPending}
        disabled={value.trim().length < 3 || check.isPending}
        onPress={() => check.mutate()}
      />
      {check.data ? <Verdict result={check.data} /> : null}
      {check.error ? (
        <Text variant="callout" color="destructive">
          {check.error instanceof ApiError ? check.error.message : 'Could not run the check.'}
        </Text>
      ) : null}
    </Card>
  );
}

function Verdict({ result }: { result: ContactVerdict }) {
  const { colors, spacing, radius } = useTheme();
  if (result.verdict === 'INVALID') {
    return (
      <Text variant="callout" color="destructive">
        {result.message}
      </Text>
    );
  }
  const good = result.verdict === 'VERIFIED';
  const Icon = good ? CheckCircle2 : result.verdict === 'UNKNOWN' ? AlertTriangle : ShieldAlert;
  const text =
    result.verdict === 'VERIFIED'
      ? `This is ${result.name}, ${result.role.toLowerCase()} for ${result.propertyTitle}. Even so, only pay rent in GetRentos.`
      : result.verdict === 'NEVER_PAY_OUTSIDE'
        ? 'Do not pay into any bank account, whoever asks. Your landlord and manager are paid by GetRentos; you pay only in GetRentos. If someone asked you to pay this account, report it below.'
        : 'This is not anyone who manages your home. Do not pay them or share codes or documents. Report it below.';
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: good ? colors.successSubtle : colors.destructiveSubtle,
      }}
    >
      <Icon size={18} color={good ? colors.success : colors.destructive} />
      <Text variant="callout" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function ImpostorReport({ homes }: { homes: HomeTeam[] }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [leaseId, setLeaseId] = useState(homes[0].leaseId);
  const [channel, setChannel] = useState<ImpersonationChannel>('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [claimedToBe, setClaimedToBe] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);
  const report = useMutation({
    mutationFn: () =>
      renterHomeApi.reportImpersonation({
        leaseId,
        channel,
        ...(contactValue.trim() ? { contactValue: contactValue.trim() } : {}),
        claimedToBe: claimedToBe.trim(),
        description: description.trim(),
        ...(amount ? { amountAsked: amount } : {}),
        paid,
      }),
    onSuccess: () => {
      setSent(true);
      setOpen(false);
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not send your report.', 'error'),
  });

  if (sent) {
    return (
      <Card style={{ flexDirection: 'row', gap: spacing.sm }}>
        <CheckCircle2 size={18} color={colors.success} />
        <Text variant="callout" style={{ flex: 1 }}>
          Thank you. GetRentos will look into it, and your landlord and manager have been warned
          (without your name). If you already paid, report it to your bank now too.
        </Text>
      </Card>
    );
  }
  if (!open) {
    return (
      <Button
        label="Report someone posing as your landlord, manager or GetRentos"
        variant="outline"
        onPress={() => setOpen(true)}
      />
    );
  }
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="bodyStrong">Report an impostor</Text>
      {homes.length > 1 ? (
        <ChipSelect
          label="Which home"
          options={homes.map((h) => ({ value: h.leaseId, label: h.propertyTitle }))}
          value={leaseId}
          onChange={setLeaseId}
        />
      ) : null}
      <ChipSelect
        label="How they contacted you"
        options={IMPERSONATION_CHANNELS}
        value={channel}
        onChange={setChannel}
      />
      <TextField
        label="Their number, email or account"
        optional
        value={contactValue}
        onChangeText={setContactValue}
        autoCapitalize="none"
      />
      <TextField
        label="Who they said they were"
        placeholder="For example, your new manager"
        value={claimedToBe}
        onChangeText={setClaimedToBe}
      />
      <CurrencyField
        label="Amount they asked for"
        optional
        value={amount}
        onValueChange={setAmount}
      />
      <TextField
        label="What happened"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
        hint="At least 10 characters."
      />
      <Checkbox checked={paid} onChange={setPaid} label="I already paid them" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button
          label="Send report"
          variant="destructive"
          loading={report.isPending}
          disabled={!reportReady(claimedToBe, description) || report.isPending}
          onPress={() => report.mutate()}
        />
        <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} />
      </View>
    </Card>
  );
}
