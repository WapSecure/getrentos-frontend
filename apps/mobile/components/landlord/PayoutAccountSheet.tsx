import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, FormAlert, Text, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi, type PayoutAccount } from '@/lib/api/landlord';
import { payoutAccountValid } from '@/lib/api/estateGovernance';
import { BankAccountFields } from '@/components/forms/BankAccountFields';
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

  const save = useMutation({
    mutationFn: () =>
      landlordApi.updatePayoutAccount({
        bankCode: bankCode.trim(),
        accountNumber: accountNumber.trim(),
      }),
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
      />
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
        label={account?.accountNumber ? 'Update payout account' : 'Save payout account'}
        disabled={!payoutAccountValid(bankCode, accountNumber)}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
