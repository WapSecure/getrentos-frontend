import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, CreditCard, Trash2, Wallet as WalletIcon } from 'lucide-react-native';
import {
  Card,
  FormAlert,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  paymentsApi,
  PAYMENT_METHOD_TYPE_LABEL,
  type SavedPaymentMethod,
} from '@/lib/api/payments';
import { errorMessage } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const TYPE_ICON: Record<SavedPaymentMethod['type'], typeof CreditCard> = {
  card: CreditCard,
  bank: Building2,
  wallet: WalletIcon,
};

export default function PaymentMethods() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.renter.paymentMethods,
    queryFn: paymentsApi.listMethods,
  });

  const methods = query.data ?? [];

  const remove = useMutation({
    mutationFn: (id: string) => paymentsApi.removeMethod(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.paymentMethods });
      toast.show('Payment method removed.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not remove that method.'), 'error'),
  });

  const confirmRemove = (m: SavedPaymentMethod) => {
    Alert.alert('Remove these details?', `${m.name} isn't used to pay. This only removes it.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(m.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Payments"
        title="Payment methods"
        subtitle="How paying works on Sureground"
        onBack={() => goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <FormAlert
          tone="info"
          message="You choose how to pay (card, bank transfer or USSD) on Paystack’s or Monnify’s secure page each time you pay. Sureground never sees or keeps your card details, so there is nothing to add here."
        />

        {methods.length > 0 ? (
          <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.md }}>
            Details you saved here before. They aren’t used to pay, so you can remove them.
          </Text>
        ) : null}

        <QueryState
          query={query}
          skeleton={
            <View style={{ gap: spacing.sm }}>
              {[0, 1].map((i) => (
                <Skeleton key={i} height={84} radius={radius.lg} />
              ))}
            </View>
          }
        >
          {methods.map((m) => {
            const Icon = TYPE_ICON[m.type] ?? CreditCard;
            return (
              <Card key={m.id} padding={spacing.lg}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.secondary,
                    }}
                  >
                    <Icon size={19} color={colors.foreground} />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="bodyStrong">{m.name}</Text>
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {PAYMENT_METHOD_TYPE_LABEL[m.type]}
                      {m.last4 ? ` ···· ${m.last4}` : ''}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => confirmRemove(m)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${m.name}`}
                    hitSlop={10}
                  >
                    <Trash2 size={17} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </QueryState>
      </ScrollView>
    </View>
  );
}
