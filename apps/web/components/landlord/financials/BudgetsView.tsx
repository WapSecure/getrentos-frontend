'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Target, Trash2, Pencil } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import {
  landlordService,
  type ExpenseCategory,
  type BillingCycle,
} from '@/services/landlordService';
import { budgetService, type BudgetWithActuals } from '@/services/budgetService';

const WHOLE_PROPERTY = '__ALL__';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  UTILITIES: 'Utilities',
  INSURANCE: 'Insurance',
  TAX: 'Tax',
  REPAIRS: 'Repairs',
  MANAGEMENT_FEE: 'Management fee',
  LEGAL: 'Legal',
  OTHER: 'Other',
};

const PERIOD_LABELS: Record<BillingCycle, string> = {
  MONTHLY: 'This month',
  QUARTERLY: 'This quarter',
  ANNUAL: 'This year',
};

const categoryOptions = [
  { value: WHOLE_PROPERTY, label: 'Whole property (all categories)' },
  ...(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c],
  })),
];

const periodOptions = (Object.keys(PERIOD_LABELS) as BillingCycle[]).map((p) => ({
  value: p,
  label: { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUAL: 'Annual' }[p],
}));

type BudgetForm = {
  propertyId: string;
  category: string; // WHOLE_PROPERTY or an ExpenseCategory
  period: BillingCycle;
  amount: number;
};

const emptyForm: BudgetForm = {
  propertyId: '',
  category: WHOLE_PROPERTY,
  period: 'MONTHLY',
  amount: 0,
};

function utilisationTone(pct: number): { variant: 'success' | 'warning' | 'danger'; bar: string } {
  if (pct > 100) return { variant: 'danger', bar: 'bg-destructive' };
  if (pct >= 80) return { variant: 'warning', bar: 'bg-warning' };
  return { variant: 'success', bar: 'bg-success' };
}

export function BudgetsView() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BudgetForm>(emptyForm);

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: landlordKeys.budgets(),
    queryFn: () => unwrap(budgetService.list()),
  });

  const { data: propertiesData } = useQuery({
    queryKey: [...landlordKeys.properties, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(landlordService.listProperties({ page: 1, pageSize: 100 })),
  });
  const properties = propertiesData?.items ?? [];

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        budgetService.set({
          propertyId: form.propertyId,
          category:
            form.category === WHOLE_PROPERTY ? undefined : (form.category as ExpenseCategory),
          period: form.period,
          amount: form.amount,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.budgets() });
      setIsOpen(false);
      setToast({ message: editingId ? 'Budget updated.' : 'Budget set.', variant: 'success' });
    },
    onError: (error: Error) =>
      setToast({ message: error.message || 'Unable to save this budget.', variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => unwrap(budgetService.remove(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.budgets() });
      setToast({ message: 'Budget removed.', variant: 'success' });
    },
    onError: (error: Error) =>
      setToast({ message: error.message || 'Unable to remove this budget.', variant: 'error' }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, propertyId: properties[0]?.id ?? '' });
    setIsOpen(true);
  };

  const openEdit = (b: BudgetWithActuals) => {
    setEditingId(b.id);
    setForm({
      propertyId: b.propertyId,
      category: b.category ?? WHOLE_PROPERTY,
      period: b.period,
      amount: b.amount,
    });
    setIsOpen(true);
  };

  const canSave = Boolean(form.propertyId) && form.amount > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Budgets vs actuals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a spending target per property and category, and track it against what you&rsquo;ve
            actually spent this period. Actuals include recorded expenses and completed work-order
            costs.
          </p>
        </div>
        <Button onClick={openCreate} disabled={properties.length === 0}>
          Set a budget
        </Button>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary/50" />
      ) : budgets.length === 0 ? (
        <Card static className="p-2">
          <EmptyState
            icon={Target}
            title="No budgets yet"
            description="Set a monthly, quarterly or annual target for a property to track spend against it."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const tone = utilisationTone(b.utilisationPct);
            const over = b.variance < 0;
            return (
              <Card key={b.id} static className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{b.propertyTitle}</h3>
                      <Badge variant="neutral">
                        {b.category ? CATEGORY_LABELS[b.category] : 'Whole property'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {PERIOD_LABELS[b.period]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatCurrency(b.actual)}
                      </span>{' '}
                      spent of {formatCurrency(b.amount)} ·{' '}
                      <span className={over ? 'text-destructive' : 'text-success'}>
                        {over
                          ? `${formatCurrency(Math.abs(b.variance))} over`
                          : `${formatCurrency(b.variance)} left`}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tone.variant}>{b.utilisationPct}%</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      rounded="md"
                      icon={<Pencil className="h-4 w-4" />}
                      onClick={() => openEdit(b)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      rounded="md"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => remove.mutate(b.id)}
                      disabled={remove.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${tone.bar}`}
                    style={{ width: `${Math.min(100, b.utilisationPct)}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {editingId ? 'Update budget' : 'Set a budget'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            A target for one property, over a recurring period. Setting a budget that already exists
            replaces its amount.
          </DialogDescription>

          <div className="mt-5 space-y-4">
            <Field label="Property">
              <Select
                value={form.propertyId}
                onValueChange={(propertyId) => setForm((f) => ({ ...f, propertyId }))}
                placeholder="Select a property"
                disabled={Boolean(editingId)}
                options={properties.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select
                  value={form.category}
                  onValueChange={(category) => setForm((f) => ({ ...f, category }))}
                  disabled={Boolean(editingId)}
                  options={categoryOptions}
                />
              </Field>
              <Field label="Period">
                <Select
                  value={form.period}
                  onValueChange={(period) =>
                    setForm((f) => ({ ...f, period: period as BillingCycle }))
                  }
                  disabled={Boolean(editingId)}
                  options={periodOptions}
                />
              </Field>
            </div>
            <Field label="Budget amount">
              <CurrencyInput
                value={form.amount}
                onValueChange={(amount) => setForm((f) => ({ ...f, amount }))}
                prefix="₦"
                placeholder="0"
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" rounded="md" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              rounded="md"
              onClick={() => save.mutate()}
              disabled={!canSave || save.isPending}
            >
              {save.isPending ? 'Saving…' : editingId ? 'Update budget' : 'Set budget'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
