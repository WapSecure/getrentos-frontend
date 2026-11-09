import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, FormAlert, Text, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi, type PayoutAccount } from '@/lib/api/landlord';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  lookupAllowsSave,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  type AccountLookup,
} from '@sureground/shared';
import { BankAccountFields } from '@/components/forms/BankAccountFields';
import { PayoutCooldownHint } from '@/components/payouts/PayoutHoldNotice';
import { withStepUpSummary } from '@/lib/stepUp';
import { qk } from '@/lib/query/keys';
import { haptics } from '@/lib/haptics';
import { errorMessage } from '@/lib/api/client';

/** Add or change the bank account a landlord's rent is paid out to. */
export function PayoutAccountSheet({
  open,
  onClose,
  account,
}: {
  open: boolean;
  onClose: () => void;
  account?: PayoutAccount;
}) {
  const has = !!account?.accountNumber;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={has ? 'Change payout account' : 'Add a payout account'}
    >
      {open ? <PayoutAccountForm account={account} onDone={onClose} /> : null}
    </Sheet>
  );
}

function PayoutAccountForm({ account, onDone }: { account?: PayoutAccount; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);

  const save = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
        }),
        () =>
          landlordApi.updatePayoutAccount({
            bankCode: bankCode.trim(),
            accountNumber: accountNumber.trim(),
          })
      ),
    onSuccess: (saved) => {
      void haptics.success();
      qc.setQueryData(qk.landlord.payout, saved);
      toast.show(
        saved.verified
          ? `Rent now pays out to ${saved.accountName}.`
          : 'Saved. The bank hasn’t confirmed the account yet.',
        'success'
      );
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      {account?.accountNumber && !account.verified ? (
        <FormAlert
          tone="warning"
          message="The current account isn’t verified. Save it again to check it against the bank."
        />
      ) : null}
      <BankAccountFields
        bankCode={bankCode}
        onBankCode={setBankCode}
        accountNumber={accountNumber}
        onAccountNumber={setAccountNumber}
        onLookup={setLookup}
      />
      {account?.accountNumber ? <PayoutCooldownHint /> : null}
      <Text variant="caption" color="mutedForeground">
        We check the name on the account with the bank. You’ll be asked to confirm it’s you: this
        decides where your rent goes.
      </Text>
      {save.error ? (
        <FormAlert
          message={errorMessage(save.error, 'We couldn’t check that account. Try again.')}
        />
      ) : null}
      <Button
        label={saveAccountLabel(
          lookup,
          account?.accountNumber ? 'Update payout account' : 'Save payout account'
        )}
        disabled={!lookupAllowsSave(lookup)}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
