import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Target } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ListSkeleton,
  NumberField,
  Price,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  BUDGET_CATEGORIES,
  CATEGORY_LABEL,
  landlordFinanceApi,
  PERIOD_LABEL,
  PERIODS,
  utilisationTone,
  type Budget,
  type BudgetPeriod,
  type ExpenseCategory,
} from '@/lib/api/landlordFinance';
import { ApiError } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { useMyHomes } from '@/hooks/useMyHomes';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { planRefusal, retryUnlessPlanGate } from '@/lib/api/estateGate';
import { ProUpsell } from '@/components/estate/governance/ProUpsell';

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/**
 * Budgets against actual spend, per property and category, for the current
 * month, quarter or year. Actuals include recorded expenses and completed
 * work-order costs.
 */
export default function LandlordBudgets() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState<Budget | 'new' | null>(null);
  const list = useQuery({
    queryKey: qk.landlord.budgets,
    queryFn: landlordFinanceApi.budgets,
    retry: retryUnlessPlanGate,
  });
  const budgets = list.data ?? [];
  const locked = !!planRefusal(list.error);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Financials"
        title="Budgets"
        subtitle="Targets against what you actually spend"
        onBack={() => goBack()}
        accessory={
          locked ? null : (
            <IconButton
              onPress={() => setEditing('new')}
              accessibilityLabel="Set a budget"
              icon={<Plus size={20} color={colors.primary} />}
            />
          )
        }
      />
      {locked ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <ProUpsell
            title="Budgets are part of Pro"
            description="Set spending targets per property and see where you stand."
            perks={[
              'Monthly, quarterly or annual targets per property or category',
              'Actual spend from expenses and completed work orders',
            ]}
            note={null}
          />
        </View>
      ) : list.isError && !list.data ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => list.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {list.isLoading ? (
            <ListSkeleton rows={3} variant="card" height={110} />
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={<Target size={32} color={colors.mutedForeground} />}
              title="No budgets yet"
              description="Set a monthly, quarterly or annual target for a property to track spend against it."
              action={<Button label="Set a budget" onPress={() => setEditing('new')} />}
            />
          ) : (
            budgets.map((b) => <BudgetCard key={b.id} budget={b} onEdit={() => setEditing(b)} />)
          )}
        </ScrollView>
      )}

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Set a budget' : 'Update budget'}
      >
        {editing ? (
          <BudgetForm
            key={editing === 'new' ? 'new' : editing.id}
            budget={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function BudgetCard({ budget: b, onEdit }: { budget: Budget; onEdit: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const tone = utilisationTone(b.utilisationPct);
  const over = b.variance < 0;
  const bar =
    tone === 'danger' ? colors.destructive : tone === 'warning' ? colors.warning : colors.success;

  const remove = useMutation({
    mutationFn: () => landlordFinanceApi.removeBudget(b.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landlord.budgets });
      toast.show('Budget removed.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not remove the budget.'), 'error'),
  });

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
          {b.propertyTitle}
        </Text>
        <Badge label={`${b.utilisationPct}%`} tone={tone} />
      </View>
      <Text variant="caption" color="mutedForeground">
        {b.category ? CATEGORY_LABEL[b.category] : 'Whole property'} · {PERIOD_LABEL[b.period]}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
        <Price amount={b.actual} variant="bodyStrong" />
        <Text variant="callout" color="mutedForeground">
          spent of {formatNaira(b.amount)} ·
        </Text>
        <Text
          variant="callout"
          style={{ color: over ? colors.destructive : colors.success, fontWeight: '600' }}
        >
          {over ? `${formatNaira(Math.abs(b.variance))} over` : `${formatNaira(b.variance)} left`}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: radius.full,
          backgroundColor: colors.secondary,
          overflow: 'hidden',
        }}
        accessibilityLabel={`${b.utilisationPct}% of the budget used`}
      >
        <View
          style={{
            width: `${Math.min(100, Math.max(0, b.utilisationPct))}%`,
            height: '100%',
            backgroundColor: bar,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
        <Button label="Edit" size="sm" variant="secondary" onPress={onEdit} />
        <Button
          label="Remove"
          size="sm"
          variant="ghost"
          loading={remove.isPending}
          onPress={() =>
            Alert.alert('Remove this budget?', `${b.propertyTitle}, ${PERIOD_LABEL[b.period]}.`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => remove.mutate() },
            ])
          }
        />
      </View>
    </Card>
  );
}

function BudgetForm({ budget, onDone }: { budget: Budget | null; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState(budget?.propertyId ?? '');
  const [category, setCategory] = useState<ExpenseCategory | 'ALL'>(budget?.category ?? 'ALL');
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? 'MONTHLY');
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '');
  // A budget is keyed by property, category and period, so an edit changes only the amount.
  const locked = !!budget;

  const save = useMutation({
    mutationFn: () =>
      landlordFinanceApi.setBudget({
        propertyId,
        ...(category === 'ALL' ? {} : { category }),
        period,
        amount: Math.round(Number(amount)),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landlord.budgets });
      toast.show(budget ? 'Budget updated.' : 'Budget set.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorText(e, 'Could not save the budget.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        A target for one property over a recurring period. Setting one that already exists replaces
        its amount.
      </Text>
      <ChipSelect
        label="Property"
        options={(homes.data ?? []).map((h) => ({ value: h.id, label: h.name }))}
        value={propertyId || undefined}
        onChange={setPropertyId}
        disabled={locked}
        emptyText={homes.isLoading ? 'Loading properties…' : 'No properties.'}
      />
      <ChipSelect
        label="Category"
        options={BUDGET_CATEGORIES}
        value={category}
        onChange={setCategory}
        disabled={locked}
      />
      <ChipSelect
        label="Period"
        options={PERIODS}
        value={period}
        onChange={setPeriod}
        disabled={locked}
      />
      <NumberField currency label="Budget amount" value={amount} onValueChange={setAmount} />
      <Button
        label={budget ? 'Update budget' : 'Set budget'}
        loading={save.isPending}
        disabled={!propertyId || !(Number(amount) > 0) || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
