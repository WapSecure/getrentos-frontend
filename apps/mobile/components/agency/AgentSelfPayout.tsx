import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  Price,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import {
  agencyFirmApi,
  bankProblem,
  hasAccount,
  PAYOUT_STATUS,
  type MySummary,
  type PayoutAccount,
  type PayoutRecord,
} from '@/lib/api/agencyFirm';
import { formatDay } from '@/lib/api/agency';
import { errorMessage } from '@/lib/api/client';
import { BankAccountFields } from '@/components/forms/BankAccountFields';
import { formatNaira } from '@/lib/format';


/** Recent payouts, newest first. */
export function History({ items }: { items: PayoutRecord[] }) {
  const { colors, spacing } = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((p, i) => {
        const s = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.PENDING;
        return (
          <View key={p.id ?? `${p.createdAt}-${i}`} style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Price amount={p.amount} variant="callout" style={{ flex: 1 }} />
              <Badge label={s.label} tone={s.tone} />
            </View>
            <Text variant="caption" color="mutedForeground">
              {formatDay(p.createdAt)}
            </Text>
            {p.status === 'FAILED' && p.failureReason ? (
              <Text variant="caption" style={{ color: colors.destructive }}>
                {p.failureReason}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** A bank account on file, or the form to set one (with the 24-hour hold note). */
export function AccountForm({
  account,
  onSave,
  saving,
}: {
  account: PayoutAccount | null;
  onSave: (bankCode: string, accountNumber: string) => void;
  saving: boolean;
}) {
  const { spacing } = useTheme();
  const [editing, setEditing] = useState(!hasAccount(account));
  // Captured once: render must not read the clock.
  const [now] = useState(() => Date.now());
  const [bankCode, setBankCode] = useState(account?.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const problem = bankProblem(bankCode, accountNumber);
  if (!editing && account) {
    return (
      <View style={{ gap: spacing.xs }}>
        <Text variant="callout">
          {account.bankName ?? account.bankCode} · {account.accountNumber}
          {account.accountName ? ` · ${account.accountName}` : ''}
        </Text>
        {account.payoutHoldUntil && Date.parse(account.payoutHoldUntil) > now ? (
          <Text variant="caption" color="mutedForeground">
            New details: payouts to this account start after {formatDay(account.payoutHoldUntil)}.
          </Text>
        ) : null}
        <Button
          label="Change account"
          size="sm"
          variant="ghost"
          onPress={() => setEditing(true)}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      <BankAccountFields
        bankCode={bankCode}
        onBankCode={setBankCode}
        accountNumber={accountNumber}
        onAccountNumber={setAccountNumber}
      />
      <Text variant="caption" color="mutedForeground">
        Changing your bank details pauses payouts to the new account for 24 hours, and we’ll email
        you about it.
      </Text>
      {problem && (bankCode || accountNumber) ? (
        <Text variant="caption" color="mutedForeground">
          {problem}
        </Text>
      ) : null}
      <Button
        label="Save account"
        size="sm"
        loading={saving}
        disabled={!!problem || saving}
        onPress={() => onSave(bankCode.trim(), accountNumber.trim())}
      />
    </View>
  );
}

/**
 * An agency agent's own share of the firm's commissions: earned, paid and
 * pending, the account it goes to, and recent payouts. Used in the agency
 * workspace and for realtors and agents who belong to a firm.
 */
export function MyPayout({
  account,
  summary,
  history,
  onChanged,
}: {
  account: PayoutAccount | null;
  summary: MySummary;
  history: PayoutRecord[];
  onChanged: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const save = useMutation({
    mutationFn: ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }) =>
      agencyFirmApi.setMyPayoutAccount(bankCode, accountNumber),
    onSuccess: () => {
      onChanged();
      toast.show('Your payout account is saved.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save the account.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Your share as an agent</Text>
      <Text variant="callout" color="mutedForeground">
        Earned {formatNaira(summary.earned)} · paid {formatNaira(summary.paid)} · pending{' '}
        {formatNaira(summary.pending)}
      </Text>
      {!summary.canReceive ? (
        <FormAlert
          tone="warning"
          message={`Verify your identity to trust tier ${summary.withdrawTierRequired} to receive payouts.`}
        />
      ) : null}
      {!summary.canReceive ? (
        <Button
          label="Verify your identity"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/(app)/verify-identity')}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      <AccountForm
        key={account?.accountNumber ?? 'none'}
        account={hasAccount(account) ? account : null}
        saving={save.isPending}
        onSave={(bankCode, accountNumber) => save.mutate({ bankCode, accountNumber })}
      />
      <History items={history.slice(0, 5)} />
    </Card>
  );
}
