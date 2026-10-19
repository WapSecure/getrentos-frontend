import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  NumberField,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import {
  roommatesApi,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
} from '@/lib/api/roommates';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  names: string[];
}

export function AddExpenseSheet({ open, onClose, names }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title="Add a shared expense"
    >
      {/* Remount on each open so the form always starts blank. */}
      <AddExpenseForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        onSubmittingChange={setSubmitting}
        names={names}
      />
    </Sheet>
  );
}

function AddExpenseForm({
  onClose,
  onSubmittingChange,
  names,
}: Omit<Props, 'open'> & { onSubmittingChange: (submitting: boolean) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(names[0] ?? '');
  const [splitAmong, setSplitAmong] = useState<string[]>(names);
  const [category, setCategory] = useState<ExpenseCategory>('other');

  const mutation = useMutation({
    mutationFn: () =>
      roommatesApi.addExpense({
        description: description.trim(),
        amount: Math.round(Number(amount)),
        paidBy: paidBy.trim(),
        splitAmong,
        category,
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.roommateExpenses });
      toast.show('Expense added.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not add this expense.', 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  const toggleSplit = (name: string) => {
    setSplitAmong((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const canSubmit =
    description.trim().length > 0 &&
    Number(amount) > 0 &&
    paidBy.trim().length > 0 &&
    splitAmong.length > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="What was it for?"
        required
        placeholder="e.g. Groceries"
        value={description}
        onChangeText={setDescription}
        editable={!mutation.isPending}
      />
      <NumberField
        label="Amount"
        required
        currency
        placeholder="0"
        value={amount}
        onValueChange={setAmount}
        editable={!mutation.isPending}
      />
      <TextField
        label="Paid by"
        required
        placeholder="Name"
        value={paidBy}
        onChangeText={setPaidBy}
        editable={!mutation.isPending}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {EXPENSE_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={EXPENSE_CATEGORY_LABEL[c]}
              selected={category === c}
              onPress={() => setCategory(c)}
              disabled={mutation.isPending}
            />
          ))}
        </View>
      </View>

      {names.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Split among</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {names.map((n) => (
              <Chip
                key={n}
                label={n}
                selected={splitAmong.includes(n)}
                onPress={() => toggleSplit(n)}
                disabled={mutation.isPending}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Button
        label="Add expense"
        loading={mutation.isPending}
        disabled={mutation.isPending || !canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
