import { useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, ReceiptText, Trash2, Wrench } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, EXPENSE_CATEGORY_LABEL, type LandlordExpense } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { AddExpenseSheet } from '@/components/landlord/AddExpenseSheet';

export default function LandlordExpenses() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const query = useQuery({
    queryKey: qk.landlord.expenses(),
    queryFn: () => landlordApi.expenses(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => landlordApi.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'expenses'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'financials'] });
      toast.show('Expense removed.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not remove that expense.', 'error'),
  });

  const items = query.data?.items ?? [];
  const total = items.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title">Expenses</Text>
          {items.length > 0 ? (
            <Text variant="caption" color="mutedForeground">
              {items.length} logged on this page
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          accessibilityLabel="Log an expense"
          hitSlop={10}
        >
          <Plus size={22} color={colors.primary} />
        </Pressable>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(e) => e.id}
          renderItem={({ item }: { item: LandlordExpense }) => (
            <ExpenseRow
              expense={item}
              onRemove={() =>
                Alert.alert('Remove expense?', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => remove.mutate(item.id),
                  },
                ])
              }
            />
          )}
          ListHeaderComponent={
            items.length > 0 ? (
              <Card elevated style={{ marginBottom: spacing.sm }}>
                <View style={{ gap: 2 }}>
                  <Text variant="caption" color="mutedForeground">
                    Total on this page
                  </Text>
                  <Price amount={total} variant="heading" />
                </View>
              </Card>
            ) : null
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={84} radius={radius.lg} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<ReceiptText size={32} color={colors.mutedForeground} />}
                title="No expenses logged"
                description="Track what a property costs so your net profit reflects reality."
              />
            )
          }
        />
      )}

      <AddExpenseSheet open={adding} onClose={() => setAdding(false)} />
    </View>
  );
}

function ExpenseRow({ expense: e, onRemove }: { expense: LandlordExpense; onRemove: () => void }) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Badge label={EXPENSE_CATEGORY_LABEL[e.category]} tone="neutral" />
          <View style={{ flex: 1 }} />
          <Price amount={e.amount} variant="bodyStrong" />
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${EXPENSE_CATEGORY_LABEL[e.category]} expense`}
            hitSlop={10}
          >
            <Trash2 size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {e.propertyTitle} · {formatDate(e.incurredAt, 'short')}
        </Text>

        {e.note ? (
          <Text variant="caption" color="mutedForeground">
            {e.note}
          </Text>
        ) : null}

        {/* Linked repairs are how an expense ties back to a tenant's report. */}
        {e.maintenanceRequestId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Wrench size={12} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground">
              From a maintenance request
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
