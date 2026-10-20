import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import {
  Button,
  Card,
  ErrorState,
  NumberField,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerSettingsApi,
  type BuyerPaymentMethod as BuyerPaymentMethodData,
} from '@/lib/api/buyerSettings';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function BuyerPaymentMethod() {
  const { colors, spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.buyer.paymentMethod,
    queryFn: buyerSettingsApi.getPaymentMethod,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Buyer finance"
        title="Payment method"
        subtitle="The account you pay deposits from"
        onBack={() => goBack()}
      />

      {query.data ? (
        <PaymentMethodForm data={query.data} />
      ) : query.isLoading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={200} radius={16} />
        </View>
      ) : (
        <ErrorState onRetry={() => query.refetch()} />
      )}
    </View>
  );
}

function PaymentMethodForm({ data }: { data: BuyerPaymentMethodData }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [bankName, setBankName] = useState(data.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(data.accountNumber ?? '');
  const [accountName, setAccountName] = useState(data.accountName ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      buyerSettingsApi.updatePaymentMethod({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.buyer.paymentMethod, updated);
      toast.show('Payment method saved.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save these details.', 'error'),
  });

  const canSave =
    bankName.trim().length > 0 && accountNumber.trim().length > 0 && accountName.trim().length > 0;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <Text variant="caption" color="mutedForeground">
        The bank account you&apos;ll use to pay deposits and protected payments.
      </Text>

      {data.verified ? (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.successSubtle,
          }}
        >
          <ShieldCheck size={16} color={colors.success} />
          <Text variant="callout" style={{ color: colors.success }}>
            Verified account
          </Text>
        </Card>
      ) : null}

      <Card elevated style={{ gap: spacing.md }}>
        <TextField label="Bank name" value={bankName} onChangeText={setBankName} required />
        <NumberField
          label="Account number"
          value={accountNumber}
          onValueChange={setAccountNumber}
          code
          maxLength={10}
          required
        />
        <TextField
          label="Account name"
          value={accountName}
          onChangeText={setAccountName}
          required
        />
      </Card>

      <Button
        label="Save"
        loading={mutation.isPending}
        disabled={!canSave}
        onPress={() => mutation.mutate()}
      />
    </ScrollView>
  );
}
