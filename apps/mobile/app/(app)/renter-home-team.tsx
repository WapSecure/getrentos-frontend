import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Users } from 'lucide-react-native';
import {
  Button,
  Card,
  Checkbox,
  CurrencyField,
  FormAlert,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  CONTACT_KINDS,
  IMPERSONATION_CHANNELS,
  renterHomeApi,
  reportReady,
  verdictAlert,
  type ContactKind,
  type HomeTeam,
  type ImpersonationChannel,
} from '@/lib/api/renterHome';
import { errorMessage } from '@/lib/api/client';
import { SUPPORT, hasSupportLine } from '@/lib/support';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * Who really manages the tenant's home and how to spot an impostor: the
 * verified landlord and managers, a check for any number, email or account
 * someone used, and a report that reaches Sureground and the real landlord.
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
        <QueryState
          query={q}
          skeleton={<ListSkeleton rows={2} variant="card" height={120} />}
          isEmpty={homes.length === 0}
          empty={{
            icon: <Users size={32} color={colors.mutedForeground} />,
            title: 'No home yet',
            description: 'Once you have a lease, the people verified to manage it show here.',
          }}
        >
          <>
            <Text variant="callout" color="mutedForeground">
              These are the only people verified to act for your home. Anyone else claiming to be
              your landlord, a new manager or Sureground is not.
            </Text>
            {homes.map((h) => (
              <HomeCard key={h.leaseId} home={h} />
            ))}
            <PayRule />
            <ContactCheck />
            <ImpostorReport homes={homes} />
          </>
        </QueryState>
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
      <Text variant="bodyStrong">Pay rent only in Sureground</Text>
      <Text variant="callout" color="mutedForeground">
        Sureground never asks you to pay into a personal account, and a change of manager never
        changes how you pay.
        {hasSupportLine()
          ? ` Sureground support only contacts you from ${[SUPPORT.phone, SUPPORT.whatsapp]
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
      {check.data ? <FormAlert {...verdictAlert(check.data)} /> : null}
      {check.error ? (
        <Text variant="callout" color="destructive">
          {errorMessage(check.error, 'Could not run the check.')}
        </Text>
      ) : null}
    </Card>
  );
}

function ImpostorReport({ homes }: { homes: HomeTeam[] }) {
  const { spacing } = useTheme();
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
    onError: (e) => toast.show(errorMessage(e, 'Could not send your report.'), 'error'),
  });

  if (sent) {
    return (
      <FormAlert
        tone="success"
        message="Thank you. Sureground will look into it, and your landlord and manager have been warned (without your name). If you already paid, report it to your bank now too."
      />
    );
  }
  if (!open) {
    return (
      <Button
        label="Report someone posing as your landlord, manager or Sureground"
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
