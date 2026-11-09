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
} from '@sureground/ui-native';
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
import { PayoutCooldownHint, PayoutHoldNotice } from '@/components/payouts/PayoutHoldNotice';
import { PayoutRowDetails } from '@/components/payouts/PayoutRowDetails';
import { formatNaira } from '@/lib/format';
import { withStepUpSummary } from '@/lib/stepUp';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  lookupAllowsSave,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  type AccountLookup,
} from '@sureground/shared';

// An agent's own payouts arrive in lower case.
function payoutKey(status: string): 'PENDING' | 'SUCCESS' | 'FAILED' {
  const s = status.toUpperCase();
  return s === 'SUCCESS' || s === 'FAILED' ? s : 'PENDING';
}

export function History({ items }: { items: PayoutRecord[] }) {
  const { spacing } = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((p, i) => {
        const key = payoutKey(p.status);
        const s = PAYOUT_STATUS[key];
        return (
          <View key={p.id ?? `${p.createdAt}-${i}`} style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Price amount={p.amount} variant="callout" style={{ flex: 1 }} />
              <Badge label={s.label} tone={s.tone} />
            </View>
            <Text variant="caption" color="mutedForeground">
              Requested {formatDay(p.createdAt)}
            </Text>
            <PayoutRowDetails
              state={key === 'SUCCESS' ? 'paid' : key === 'FAILED' ? 'failed' : 'pending'}
              paidAt={p.paidAt}
              transferRef={p.transferRef}
              failureReason={p.failureReason}
              sentTo={p.sentTo}
            />
          </View>
        );
      })}
    </View>
  );
}

export function AccountForm({
  account,
  onSave,
  saving,
}: {
  account: PayoutAccount | null;
  /** `summary` says what the "confirm it's you" step authorises; run the save inside it. */
  onSave: (bankCode: string, accountNumber: string, summary: string) => void;
  saving: boolean;
}) {
  const { spacing } = useTheme();
  const [editing, setEditing] = useState(!hasAccount(account));
  const [bankCode, setBankCode] = useState(account?.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  const problem = bankProblem(bankCode, accountNumber);
  if (!editing && account) {
    return (
      <View style={{ gap: spacing.xs }}>
        <Text variant="callout">
          {payoutAccountLabel({ ...account, bankName: account.bankName ?? account.bankCode })}
          {account.accountName ? ` · ${account.accountName}` : ''}
        </Text>
        <PayoutHoldNotice holdUntil={account.payoutHoldUntil} />
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
        onLookup={setLookup}
      />
      <PayoutCooldownHint />
      {problem && (bankCode || accountNumber) ? (
        <Text variant="caption" color="mutedForeground">
          {problem}
        </Text>
      ) : null}
      <Button
        label={saveAccountLabel(lookup, 'Save account')}
        size="sm"
        loading={saving}
        disabled={!!problem || !lookupAllowsSave(lookup) || saving}
        onPress={() =>
          onSave(
            bankCode.trim(),
            accountNumber.trim(),
            payoutAccountStepUpSummary({
              bankName: lookup.bankName,
              accountNumber,
              accountName: lookup.accountName,
            })
          )
        }
      />
    </View>
  );
}

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
    mutationFn: ({
      bankCode,
      accountNumber,
      summary,
    }: {
      bankCode: string;
      accountNumber: string;
      summary: string;
    }) =>
      withStepUpSummary(summary, () => agencyFirmApi.setMyPayoutAccount(bankCode, accountNumber)),
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
        onSave={(bankCode, accountNumber, summary) =>
          save.mutate({ bankCode, accountNumber, summary })
        }
      />
      <History items={history.slice(0, 5)} />
    </Card>
  );
}
