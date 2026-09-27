import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  Check,
  CreditCard,
  Plus,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  paymentsApi,
  PAYMENT_METHOD_TYPE_LABEL,
  type SavedPaymentMethod,
} from '@/lib/api/payments';
import { ApiError } from '@/lib/api/client';
import { AddPaymentMethodSheet } from '@/components/payments/AddPaymentMethodSheet';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

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
  const [adding, setAdding] = useState(false);

  const query = useQuery({
    queryKey: qk.renter.paymentMethods,
    queryFn: paymentsApi.listMethods,
  });

  const methods = query.data ?? [];

  const setDefault = useMutation({
    mutationFn: (id: string) => paymentsApi.setDefaultMethod(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.paymentMethods });
      toast.show('Default payment method updated.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not set that default.', 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => paymentsApi.removeMethod(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.paymentMethods });
      toast.show('Payment method removed.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not remove that method.', 'error'),
  });

  const confirmRemove = (m: SavedPaymentMethod) => {
    Alert.alert('Remove payment method?', `${m.name} will no longer be available at checkout.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(m.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Wallet"
        title="Payment methods"
        subtitle="Cards, bank accounts and preferred checkout"
        onBack={() => router.back()}
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
        {query.isLoading ? (
          [0, 1].map((i) => <Skeleton key={i} height={84} radius={radius.lg} />)
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : methods.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={30} color={colors.mutedForeground} />}
            title="No payment methods"
            description="Add a card, bank account or wallet to pay rent without re-entering details."
            action={<Button label="Add a method" onPress={() => setAdding(true)} />}
          />
        ) : (
          methods.map((m) => {
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
                      {m.isDefault ? <Badge label="Default" tone="success" /> : null}
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {PAYMENT_METHOD_TYPE_LABEL[m.type]}
                      {m.last4 ? ` ···· ${m.last4}` : ''}
                      {m.expiry ? ` · expires ${m.expiry}` : ''}
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

                {m.isDefault ? null : (
                  <Pressable
                    onPress={() => setDefault.mutate(m.id)}
                    disabled={setDefault.isPending}
                    accessibilityRole="button"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: spacing.md,
                    }}
                  >
                    <Check size={15} color={colors.primary} />
                    <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
                      Set as default
                    </Text>
                  </Pressable>
                )}
              </Card>
            );
          })
        )}

        {methods.length > 0 ? (
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.lg,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.border,
              marginTop: spacing.sm,
            }}
          >
            <Plus size={17} color={colors.primary} />
            <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
              Add another method
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <AddPaymentMethodSheet open={adding} onClose={() => setAdding(false)} />
    </View>
  );
}
