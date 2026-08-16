'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileBarChart, Plus, Send } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  DatePicker,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService, type OwnerStatement } from '@/services/landlordService';

type GenerateForm = { propertyId: string; periodStart: string; periodEnd: string };
const initialForm: GenerateForm = { propertyId: '', periodStart: '', periodEnd: '' };

export default function LandlordOwnerStatementsPage() {
  const queryClient = useQueryClient();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<GenerateForm>(initialForm);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: statements = [] } = useQuery({
    queryKey: landlordKeys.ownerStatements,
    queryFn: () => unwrap(landlordService.listOwnerStatements()),
  });

  const { data: properties = [] } = useQuery({
    queryKey: landlordKeys.properties,
    queryFn: () => unwrap(landlordService.listProperties()),
  });

  const { data: detail } = useQuery({
    queryKey: landlordKeys.ownerStatement(detailId ?? ''),
    queryFn: () => unwrap(landlordService.getOwnerStatement(detailId as string)),
    enabled: !!detailId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: landlordKeys.ownerStatements });

  const generateStatement = useMutation({
    mutationFn: (input: { propertyId?: string; periodStart: string; periodEnd: string }) =>
      unwrap(landlordService.generateOwnerStatement(input)),
    onSuccess: () => {
      invalidate();
      setForm(initialForm);
      setIsGenerateOpen(false);
      setToast({ message: 'Statement generated as a draft.', variant: 'success' });
    },
    onError: (error: Error) => {
      setToast({
        message: error.message || 'Unable to generate this statement.',
        variant: 'error',
      });
    },
  });

  const issueStatement = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.issueOwnerStatement(id)),
    onSuccess: (_result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: landlordKeys.ownerStatement(id) });
      setToast({ message: 'Statement issued.', variant: 'success' });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to issue this statement.', variant: 'error' });
    },
  });

  const isValid = form.periodStart && form.periodEnd;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    generateStatement.mutate({
      propertyId: form.propertyId || undefined,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Owner Statements</h1>
          <p className="text-muted-foreground mt-1">
            Generate a per-period statement from real rent income, expenses, and management fees
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsGenerateOpen(true)}>
          <Plus className="w-4 h-4" />
          Generate statement
        </Button>
      </div>

      {statements.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={FileBarChart}
            title="No statements yet"
            description="Generate your first statement to see a real income/expense/fee breakdown for a period."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {statements.map((statement: OwnerStatement) => (
            <button
              key={statement.id}
              onClick={() => setDetailId(statement.id)}
              className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatDate(statement.periodStart)} — {formatDate(statement.periodEnd)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generated {formatDate(statement.generatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(statement.netPayout)}
                </span>
                <Badge variant={statement.status === 'ISSUED' ? 'success' : 'neutral'}>
                  {statement.status === 'ISSUED' ? 'Issued' : 'Draft'}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={submit} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Generate statement
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Computed from real PAID rent payments and recorded expenses in the period.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Property"
                hint="Leave blank for your full portfolio."
                className="sm:col-span-2"
              >
                <Select
                  ariaLabel="Statement property"
                  value={form.propertyId}
                  onValueChange={(propertyId) => setForm((current) => ({ ...current, propertyId }))}
                  placeholder="Full portfolio"
                  options={[
                    { value: '', label: 'Full portfolio' },
                    ...properties.map((property) => ({ value: property.id, label: property.name })),
                  ]}
                />
              </Field>
              <Field label="Period start" required>
                <DatePicker
                  value={form.periodStart}
                  onChange={(value) => setForm((current) => ({ ...current, periodStart: value }))}
                />
              </Field>
              <Field label="Period end" required>
                <DatePicker
                  value={form.periodEnd}
                  onChange={(value) => setForm((current) => ({ ...current, periodEnd: value }))}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                onClick={() => setIsGenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={generateStatement.isPending}
                disabled={!isValid}
              >
                Generate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-lg">
          {detail && (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {formatDate(detail.periodStart)} — {formatDate(detail.periodEnd)}
                </DialogTitle>
                <Badge variant={detail.status === 'ISSUED' ? 'success' : 'neutral'}>
                  {detail.status === 'ISSUED' ? 'Issued' : 'Draft'}
                </Badge>
              </div>

              <div className="mt-5 space-y-2">
                {detail.lineItems?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={item.amount < 0 ? 'text-red-600' : 'text-foreground'}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gross income</span>
                  <span className="text-foreground">{formatCurrency(detail.grossIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expenses</span>
                  <span className="text-foreground">-{formatCurrency(detail.totalExpenses)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Management fee</span>
                  <span className="text-foreground">-{formatCurrency(detail.managementFee)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-border">
                  <span className="text-foreground">Net payout</span>
                  <span className="text-foreground">{formatCurrency(detail.netPayout)}</span>
                </div>
              </div>

              {detail.status === 'DRAFT' && (
                <div className="mt-6 flex justify-end border-t border-border pt-5">
                  <Button
                    className="gap-2"
                    rounded="md"
                    isLoading={issueStatement.isPending}
                    onClick={() => issueStatement.mutate(detail.id)}
                  >
                    <Send className="w-4 h-4" />
                    Issue statement
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
