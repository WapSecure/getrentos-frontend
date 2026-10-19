import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  DateField,
  NumberField,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddExpenseSheet({ open, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Log an expense">
      {/* Remount per open so a dismissed draft never reappears. */}
      <AddExpenseForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        onSubmittingChange={setSubmitting}
      />
    </Sheet>
  );
}

function AddExpenseForm({
  onClose,
  onSubmittingChange,
}: {
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const properties = useQuery({
    queryKey: qk.landlord.properties(),
    queryFn: () => landlordApi.properties(),
  });

  const [propertyId, setPropertyId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('REPAIRS');
  const [amount, setAmount] = useState('');
  const [incurredAt, setIncurredAt] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      landlordApi.createExpense({
        propertyId,
        category,
        amount: Number(amount),
        incurredAt,
        note: note.trim() || undefined,
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'expenses'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'financials'] });
      toast.show('Expense logged.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not log that expense.', 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  const items = properties.data?.items ?? [];
  const valid = propertyId && Number(amount) > 0 && incurredAt;

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Property
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {items.map((p) => {
            const selected = p.id === propertyId;
            return (
              <Chip
                key={p.id}
                label={p.name}
                selected={selected}
                onPress={() => setPropertyId(p.id)}
                disabled={mutation.isPending}
              />
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Category
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {EXPENSE_CATEGORIES.map((c) => {
            const selected = c === category;
            return (
              <Chip
                key={c}
                label={EXPENSE_CATEGORY_LABEL[c]}
                selected={selected}
                onPress={() => setCategory(c)}
                disabled={mutation.isPending}
              />
            );
          })}
        </View>
      </View>

      <NumberField
        currency
        label="Amount"
        placeholder="25,000"
        value={amount}
        onValueChange={setAmount}
        editable={!mutation.isPending}
        required
      />

      <DateField
        label="Date incurred"
        value={incurredAt}
        onChange={setIncurredAt}
        disabled={mutation.isPending}
      />

      <TextField
        label="Note (optional)"
        placeholder="e.g. Replaced the kitchen tap"
        value={note}
        onChangeText={setNote}
        editable={!mutation.isPending}
      />

      <Button
        label="Log expense"
        loading={mutation.isPending}
        disabled={mutation.isPending || !valid}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
