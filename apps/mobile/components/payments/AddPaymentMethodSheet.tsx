import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { paymentsApi, type SavedPaymentMethod } from '@/lib/api/payments';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

type MethodType = SavedPaymentMethod['type'];

const TYPE_OPTIONS: { value: MethodType; label: string }[] = [
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank' },
  { value: 'wallet', label: 'Wallet' },
];

const NAME_PLACEHOLDER: Record<MethodType, string> = {
  card: 'e.g. GTBank Visa',
  bank: 'e.g. Zenith — Current',
  wallet: 'e.g. Paystack wallet',
};

export function AddPaymentMethodSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Add a payment method">
      {/* Remount per open so the form never reopens holding a stale draft. */}
      <AddPaymentMethodForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function AddPaymentMethodForm({ onClose }: { onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [type, setType] = useState<MethodType>('card');
  const [name, setName] = useState('');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      paymentsApi.addMethod({
        type,
        name: name.trim(),
        last4: last4.trim() || undefined,
        expiry: type === 'card' ? expiry.trim() || undefined : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.paymentMethods });
      toast.show('Payment method added.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not add that method.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        We never store full card numbers — only the last four digits, so you can tell your methods
        apart at checkout.
      </Text>

      <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />

      <TextField
        label="Name"
        placeholder={NAME_PLACEHOLDER[type]}
        value={name}
        onChangeText={setName}
      />

      <TextField
        label="Last 4 digits"
        placeholder="1234"
        keyboardType="number-pad"
        maxLength={4}
        value={last4}
        onChangeText={(v) => setLast4(v.replace(/\D/g, ''))}
      />

      {type === 'card' ? (
        <TextField
          label="Expiry"
          placeholder="MM/YY"
          maxLength={5}
          value={expiry}
          onChangeText={setExpiry}
        />
      ) : null}

      <Button
        label="Add method"
        loading={mutation.isPending}
        disabled={!name.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
