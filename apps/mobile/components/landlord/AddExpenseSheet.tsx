import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
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
  return (
    <Sheet open={open} onClose={onClose} title="Log an expense">
      {/* Remount per open so a dismissed draft never reappears. */}
      <AddExpenseForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function AddExpenseForm({ onClose }: { onClose: () => void }) {
  const { colors, spacing, radius } = useTheme();
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'expenses'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'financials'] });
      toast.show('Expense logged.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not log that expense.', 'error'),
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
              <Pressable
                key={p.id}
                onPress={() => setPropertyId(p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 8,
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '14' : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{ color: selected ? colors.primary : colors.mutedForeground }}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
              </Pressable>
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
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 8,
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '14' : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{ color: selected ? colors.primary : colors.mutedForeground }}
                >
                  {EXPENSE_CATEGORY_LABEL[c]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label="Amount (₦)"
        placeholder="25000"
        keyboardType="number-pad"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
      />

      <DateField label="Date incurred" value={incurredAt} onChange={setIncurredAt} />

      <TextField
        label="Note (optional)"
        placeholder="e.g. Replaced the kitchen tap"
        value={note}
        onChangeText={setNote}
      />

      <Button
        label="Log expense"
        loading={mutation.isPending}
        disabled={!valid}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
