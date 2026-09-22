'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileBarChart, Landmark, Plus, RotateCcw, Send } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DatePicker,
  EmptyState,
  Field,
  Pagination,
  SaveButton,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { estateKeys } from '@/lib/queryKeys';
import { estateService } from '@/services/estateService';
import type { EstateStatement } from '@/types/estate';

type GenerateForm = { periodStart: string; periodEnd: string };
const initialForm: GenerateForm = { periodStart: '', periodEnd: '' };

const PAGE_SIZE = 10;

const PAYOUT_BADGE: Record<
  EstateStatement['payoutStatus'],
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  PAID: { label: 'Paid out', variant: 'success' },
  PENDING: { label: 'Payout pending', variant: 'warning' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
};

interface EstateStatementsViewProps {
  estateId: string;
}

export function EstateStatementsView({ estateId }: EstateStatementsViewProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<GenerateForm>(initialForm);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data } = useQuery({
    queryKey: [...estateKeys.statements(estateId), { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(estateService.listStatements(estateId, { page, pageSize: PAGE_SIZE })),
  });
  const statements = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: detail } = useQuery({
    queryKey: estateKeys.statement(estateId, detailId ?? ''),
    queryFn: () => unwrap(estateService.getStatement(estateId, detailId as string)),
    enabled: !!detailId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: estateKeys.statements(estateId) });

  const generateStatement = useMutation({
    mutationFn: (input: { periodStart: string; periodEnd: string }) =>
      unwrap(estateService.generateStatement(estateId, input)),
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
    mutationFn: (id: string) => unwrap(estateService.issueStatement(estateId, id)),
    onSuccess: (result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: estateKeys.statement(estateId, id) });
      setToast(
        result.payoutStatus === 'FAILED'
          ? {
              message: 'Statement issued, but the payout failed — retry it below.',
              variant: 'error',
            }
          : { message: 'Statement issued.', variant: 'success' }
      );
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to issue this statement.', variant: 'error' });
    },
  });

  const retryPayout = useMutation({
    mutationFn: (id: string) => unwrap(estateService.retryStatementPayout(estateId, id)),
    onSuccess: (result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: estateKeys.statement(estateId, id) });
      setToast(
        result.payoutStatus === 'PAID'
          ? { message: 'Payout succeeded.', variant: 'success' }
          : {
              message: 'The payout failed again. Check the payout account and try again.',
              variant: 'error',
            }
      );
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Unable to retry this payout.', variant: 'error' });
    },
  });

  const isValid = form.periodStart && form.periodEnd;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    generateStatement.mutate(form);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dues Statements</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate a per-period statement from real collected dues, and pay it out to the
            estate&apos;s account
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
            description="Generate your first statement to see a real dues-collected breakdown for a period."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {statements.map((statement: EstateStatement) => (
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
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(statement.netPayout)}
                </span>
                <Badge variant={statement.status === 'ISSUED' ? 'success' : 'neutral'}>
                  {statement.status === 'ISSUED' ? 'Issued' : 'Draft'}
                </Badge>
                {statement.status === 'ISSUED' && (
                  <Badge variant={PAYOUT_BADGE[statement.payoutStatus].variant}>
                    {PAYOUT_BADGE[statement.payoutStatus].label}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={submit} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Generate statement
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Computed from real PAID dues collected in the period.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {formatDate(detail.periodStart)} — {formatDate(detail.periodEnd)}
                </DialogTitle>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={detail.status === 'ISSUED' ? 'success' : 'neutral'}>
                    {detail.status === 'ISSUED' ? 'Issued' : 'Draft'}
                  </Badge>
                  {detail.status === 'ISSUED' && (
                    <Badge variant={PAYOUT_BADGE[detail.payoutStatus].variant}>
                      {PAYOUT_BADGE[detail.payoutStatus].label}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {detail.lineItems?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-base font-semibold">
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

              {detail.status === 'ISSUED' && detail.payoutStatus === 'FAILED' && (
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <p className="text-xs text-muted-foreground">
                    The transfer to the estate&apos;s payout account didn&apos;t go through.
                  </p>
                  <Button
                    className="gap-2"
                    variant="outline"
                    rounded="md"
                    isLoading={retryPayout.isPending}
                    onClick={() => retryPayout.mutate(detail.id)}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry payout
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

/** Where estate dues are paid out to once a statement is issued. */
export function EstatePayoutAccountCard({ estateId }: { estateId: string }) {
  const queryClient = useQueryClient();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: account } = useQuery({
    queryKey: estateKeys.payoutAccount(estateId),
    queryFn: () => unwrap(estateService.getPayoutAccount(estateId)),
  });

  const canSave = bankCode.trim().length >= 3 && accountNumber.trim().length === 10;

  const save = useMutation({
    mutationFn: () =>
      unwrap(estateService.updatePayoutAccount(estateId, { bankCode, accountNumber })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estateKeys.payoutAccount(estateId) });
      setBankCode('');
      setAccountNumber('');
      setSubmitError(null);
    },
    onError: (error: Error) => {
      setSubmitError(error.message || "Unable to update the estate's payout account.");
    },
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h3 className="text-base font-semibold text-foreground mb-1">Payout Account</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Where estate dues are sent when you issue a statement.
      </p>

      {account?.accountNumber && (
        <div className="rounded-lg border border-border p-3 mb-4">
          <p className="text-sm font-medium text-foreground">
            {account.bankName} · {account.accountNumber} · {account.accountName}
          </p>
          {account.verified ? (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">
                Bank account verified and active for payouts
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Not yet verified — save it again to resolve it against the bank.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bank Code</label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              placeholder="e.g. 058 for GTBank"
              maxLength={6}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="0123456789"
            maxLength={10}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <SaveButton
          label="Update Payout Account"
          onClick={() => {
            if (canSave) save.mutate();
          }}
        />
      </div>
    </div>
  );
}
