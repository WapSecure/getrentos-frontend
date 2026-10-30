import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  FormAlert,
  NumberField,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { errorText } from '@/components/estate/EstateUI';
import { landlordApi, type PayoutAccount } from '@/lib/api/landlord';
import { payoutAccountValid } from '@/lib/api/estateGovernance';
import { COMMON_BANKS } from '@/lib/api/sellerPayout';
import { qk } from '@/lib/query/keys';
import { haptics } from '@/lib/haptics';

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
  const [other, setOther] = useState(false);
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {COMMON_BANKS.map((b) => (
          <Chip
            key={b.code}
            label={b.name}
            size="sm"
            selected={!other && bankCode === b.code}
            onPress={() => {
              setOther(false);
              setBankCode(b.code);
            }}
          />
        ))}
        <Chip
          label="Other bank"
          size="sm"
          selected={other}
          onPress={() => {
            setOther(true);
            setBankCode('');
          }}
        />
      </View>
      {other ? (
        <NumberField
          label="Bank code"
          required
          code
          value={bankCode}
          onValueChange={setBankCode}
          maxLength={6}
          hint="Your bank’s code, e.g. 058 for GTBank"
        />
      ) : null}
      <NumberField
        label="Account number"
        required
        code
        value={accountNumber}
        onValueChange={setAccountNumber}
        maxLength={10}
        hint="We check the name on the account with the bank"
      />
      <Text variant="caption" color="mutedForeground">
        You’ll be asked to confirm it’s you: this decides where your rent goes.
      </Text>
      {save.error ? (
        <FormAlert message={errorText(save.error, 'We couldn’t check that account. Try again.')} />
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
