'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  DatePicker,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService, type Expense, type ExpenseCategory } from '@/services/landlordService';
import type { Property } from '@/types/landlord';

const categoryOptions: { value: ExpenseCategory; label: string }[] = [
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TAX', label: 'Tax' },
  { value: 'REPAIRS', label: 'Repairs' },
  { value: 'MANAGEMENT_FEE', label: 'Management fee' },
  { value: 'OTHER', label: 'Other' },
];

const categoryLabel = (category: ExpenseCategory) =>
  categoryOptions.find((option) => option.value === category)?.label ?? category;

type ExpenseForm = {
  propertyId: string;
  category: ExpenseCategory;
  amount: string;
  incurredAt: string;
  note: string;
};

const initialForm: ExpenseForm = {
  propertyId: '',
  category: 'UTILITIES',
  amount: '',
  incurredAt: '',
  note: '',
};

interface ExpensesPanelProps {
  properties: Property[];
}

export function ExpensesPanel({ properties }: ExpensesPanelProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(initialForm);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: expenses = [] } = useQuery({
    queryKey: landlordKeys.expenses(),
    queryFn: () => unwrap(landlordService.listExpenses()),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: landlordKeys.expenses() });
    void queryClient.invalidateQueries({ queryKey: landlordKeys.financialChart });
    void queryClient.invalidateQueries({ queryKey: ['landlord', 'financialStats'] });
  };

  const createExpense = useMutation({
    mutationFn: (input: {
      propertyId: string;
      category: ExpenseCategory;
      amount: number;
      incurredAt: string;
      note?: string;
    }) => unwrap(landlordService.createExpense(input)),
    onSuccess: () => {
      invalidate();
      setForm(initialForm);
      setIsCreateOpen(false);
      setToast({ message: 'Expense recorded.', variant: 'success' });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to record this expense.', variant: 'error' });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.deleteExpense(id)),
    onSuccess: () => {
      invalidate();
      setToast({ message: 'Expense removed.', variant: 'success' });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to remove this expense.', variant: 'error' });
    },
  });

  const amountValue = Number(form.amount);
  const isValid = form.propertyId && amountValue > 0 && form.incurredAt;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    createExpense.mutate({
      propertyId: form.propertyId,
      category: form.category,
      amount: Math.round(amountValue),
      incurredAt: form.incurredAt,
      note: form.note.trim() || undefined,
    });
  };

  return (
    <section className="mt-8 bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Expenses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Utilities, insurance, tax, and repairs — subtracted from net profit above.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="gap-1.5"
          onClick={() => setIsCreateOpen(true)}
          disabled={properties.length === 0}
        >
          <Plus className="w-3.5 h-3.5" />
          Record expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Receipt}
            title="No expenses recorded yet"
            description="Record utilities, insurance, tax, or repair costs to see real profitability above."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {expenses.map((expense: Expense) => (
            <div key={expense.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {expense.propertyTitle} · {categoryLabel(expense.category)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(expense.incurredAt)}
                  {expense.note ? ` · ${expense.note}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(expense.amount)}
                </span>
                <button
                  onClick={() => deleteExpense.mutate(expense.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-red-600"
                  aria-label="Remove expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={submit} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Record an expense
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Real costs against a property, subtracted from rental income in your financial
              reports.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Property" required>
                <Select
                  ariaLabel="Expense property"
                  value={form.propertyId}
                  onValueChange={(propertyId) => setForm((current) => ({ ...current, propertyId }))}
                  placeholder="Select a property"
                  options={properties.map((property) => ({
                    value: property.id,
                    label: property.name,
                  }))}
                />
              </Field>
              <Field label="Category" required>
                <Select
                  ariaLabel="Expense category"
                  value={form.category}
                  onValueChange={(category) =>
                    setForm((current) => ({ ...current, category: category as ExpenseCategory }))
                  }
                  options={categoryOptions}
                />
              </Field>
              <Field label="Amount (₦)" htmlFor="expense-amount" required>
                <Input
                  id="expense-amount"
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  placeholder="e.g. 45000"
                />
              </Field>
              <Field label="Date incurred" required>
                <DatePicker
                  value={form.incurredAt}
                  onChange={(value) => setForm((current) => ({ ...current, incurredAt: value }))}
                />
              </Field>
              <Field label="Note" htmlFor="expense-note" className="sm:col-span-2">
                <Input
                  id="expense-note"
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, note: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={createExpense.isPending}
                disabled={!isValid}
              >
                Record expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </section>
  );
}
