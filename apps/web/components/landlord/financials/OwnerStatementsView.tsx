'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileBarChart, Mail, Plus, RotateCcw, Send } from 'lucide-react';
import {
  Badge,
  Button,
  CardSkeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  DatePicker,
  ListSkeleton,
  PageErrorState,
  Pagination,
  Select,
  useToast,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService, type OwnerStatement } from '@/services/landlordService';
import { StatementBreakdown } from '@/components/shared/financials/StatementBreakdown';
import { PayoutHeldNotice } from '@/components/shared/financials/PayoutHeldNotice';
import { StatementDisputeSection } from '@/components/shared/financials/StatementDisputeSection';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import { usePlanGateModal } from '@/hooks/usePlanGateModal';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';

type GenerateForm = { propertyId: string; periodStart: string; periodEnd: string };
const initialForm: GenerateForm = { propertyId: '', periodStart: '', periodEnd: '' };

const PAGE_SIZE = 10;

const PAYOUT_BADGE: Record<
  OwnerStatement['payoutStatus'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }
> = {
  PAID: { label: 'Paid out', variant: 'success' },
  PENDING: { label: 'Payout pending', variant: 'warning' },
  // Neither of these is a failure. Money held for a second signature is the
  // control working, and a refusal holds the money rather than losing it.
  AWAITING_APPROVAL: { label: 'Awaiting 2nd approval', variant: 'info' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
  REJECTED: { label: 'Payout held back', variant: 'warning' },
};

export function OwnerStatementsView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<GenerateForm>(initialForm);
  const toast = useToast();
  const { isPro, isLoading: isPlanLoading } = usePlanTier();
  const planGate = usePlanGateModal();

  const statementsQuery = useQuery({
    queryKey: [...landlordKeys.ownerStatements, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(landlordService.listOwnerStatements({ page, pageSize: PAGE_SIZE })),
    enabled: isPro,
    placeholderData: keepPreviousData,
  });
  const { data } = statementsQuery;
  const statements = data?.items ?? [];
  const total = data?.total ?? 0;

  // Dropdown of properties for generating a statement.
  const { data: propertiesData } = useQuery({
    queryKey: [...landlordKeys.properties, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(landlordService.listProperties({ page: 1, pageSize: 100 })),
  });
  const properties = propertiesData?.items ?? [];

  const { data: detail, isLoading: isDetailLoading } = useQuery({
    queryKey: landlordKeys.ownerStatement(detailId ?? ''),
    queryFn: () => unwrap(landlordService.getOwnerStatement(detailId as string)),
    enabled: !!detailId && isPro,
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
      toast.success('Statement generated as a draft.');
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) return;
      toast.error(error.message || 'Unable to generate this statement.');
    },
  });

  const issueStatement = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.issueOwnerStatement(id)),
    onSuccess: (result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: landlordKeys.ownerStatement(id) });
      if (result.payoutStatus === 'AWAITING_APPROVAL')
        toast.success(
          'Statement issued. The payout is held while a second GetRentos officer approves it. Your money is unaffected.'
        );
      else if (result.payoutStatus === 'FAILED')
        toast.error('Statement issued, but the payout failed: retry it below.');
      else if (result.payoutStatus === 'PENDING')
        toast.success(
          'Statement issued. The payout is on its way and shows as paid once your bank confirms it.'
        );
      else toast.success('Statement issued and paid out.');
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) return;
      toast.error(error.message || 'Unable to issue this statement.');
    },
  });

  const retryPayout = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.retryOwnerStatementPayout(id)),
    onSuccess: (result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: landlordKeys.ownerStatement(id) });
      if (result.payoutStatus === 'PAID') toast.success('Payout succeeded.');
      else if (result.payoutStatus === 'AWAITING_APPROVAL')
        toast.success(
          'Held for a second approval. Nothing has been sent yet, and nothing will be until it is checked.'
        );
      else if (result.payoutStatus === 'PENDING')
        toast.success('Payout sent again. It shows as paid once your bank confirms it.');
      else toast.error('The payout failed again. Check the payout account and try again.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to retry this payout.');
    },
  });

  const resendEmail = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.resendOwnerStatementEmail(id)),
    onSuccess: (result, id) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: landlordKeys.ownerStatement(id) });
      if (result.emailSentAt) toast.success('Statement emailed to you.');
      else
        toast.error(
          result.emailError
            ? `Couldn't send it: ${result.emailError}`
            : 'The email could not be sent. Try again shortly.'
        );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to send this statement.');
    },
  });

  const downloadPdf = useMutation({
    mutationFn: async (statement: { id: string; periodEnd: string }) => {
      const blob = await landlordService.downloadOwnerStatementPdf(statement.id);
      return { blob, periodEnd: statement.periodEnd };
    },
    onSuccess: ({ blob, periodEnd }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GetRentos-statement-${periodEnd.slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to download the PDF.');
    },
  });

  /**
   * Query a figure on this statement.
   *
   * The toast says what actually happens — the figure is not going to change —
   * because an owner who expects an edit will sit refreshing a number that is
   * deliberately immutable.
   */
  const raiseDispute = useMutation({
    mutationFn: ({ lineId, reason }: { lineId: string; reason: string }) =>
      unwrap(landlordService.disputeStatementLine(detailId ?? '', lineId, reason)),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({
        queryKey: landlordKeys.ownerStatement(dispute.statementId),
      });
      invalidate();
      toast.success(
        dispute.moneyEffect === 'HELD'
          ? 'Query raised, and the payout is paused until it is decided. If it is upheld the correction appears on your next statement.'
          : 'Query raised. This payout has already gone, so if it is upheld the correction appears on your next statement.'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to raise that query.');
    },
  });

  const withdrawDispute = useMutation({
    mutationFn: (disputeId: string) =>
      unwrap(landlordService.withdrawStatementLineDispute(detailId ?? '', disputeId)),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({
        queryKey: landlordKeys.ownerStatement(dispute.statementId),
      });
      invalidate();
      toast.success('Query withdrawn.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to withdraw that query.');
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
        {isPro && (
          <Button variant="primary" className="gap-2" onClick={() => setIsGenerateOpen(true)}>
            <Plus className="w-4 h-4" />
            Generate statement
          </Button>
        )}
      </div>

      <ProFeatureGate
        title="Owner statements is a Pro feature"
        description="Upgrade to Pro to generate per-period income, expense, and management-fee breakdowns to share with property owners."
      >
        {isPlanLoading || (isPro && statementsQuery.isLoading) ? (
          <ListSkeleton rows={4} />
        ) : isPro && statementsQuery.isError && !data ? (
          <PageErrorState
            title="Owner statements are unavailable"
            description="We could not load statement or payout records. No balances have been changed."
            onRetry={() => void statementsQuery.refetch()}
            isRetrying={statementsQuery.isFetching}
          />
        ) : statements.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="No statements yet"
            description="Generate your first statement to see a real income/expense/fee breakdown for a period."
          />
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {statements.map((statement: OwnerStatement) => (
              <button
                key={statement.id}
                type="button"
                onClick={() => setDetailId(statement.id)}
                className="w-full flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 text-left hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(statement.periodStart)}: {formatDate(statement.periodEnd)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generated {formatDate(statement.generatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
      </ProFeatureGate>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent padded={false} className="sm:max-w-lg">
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
        <DialogContent padded={false} className="sm:max-w-lg">
          {!detail && isDetailLoading && (
            <div className="p-6">
              <DialogTitle className="sr-only">Statement</DialogTitle>
              <CardSkeleton lines={5} />
            </div>
          )}
          {detail && (
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {formatDate(detail.periodStart)}: {formatDate(detail.periodEnd)}
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

              <StatementBreakdown className="mt-5" lineItems={detail.lineItems} totals={detail} />

              <PayoutHeldNotice
                payoutStatus={detail.payoutStatus}
                release={detail.release}
                disputeSummary={detail.disputeSummary}
              />

              <StatementDisputeSection
                lineItems={detail.lineItems}
                disputes={detail.disputes}
                // A draft can be regenerated, so querying one would convene a
                // decision about a document that does not have to exist.
                canRaise={detail.status === 'ISSUED'}
                isRaising={raiseDispute.isPending}
                isWithdrawing={withdrawDispute.isPending}
                onRaise={async (lineId, reason) => {
                  try {
                    await raiseDispute.mutateAsync({ lineId, reason });
                    return true;
                  } catch {
                    return false;
                  }
                }}
                onWithdraw={(disputeId) => withdrawDispute.mutate(disputeId)}
              />

              {detail.status === 'DRAFT' && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <Button
                    className="gap-2"
                    variant="outline"
                    rounded="md"
                    isLoading={downloadPdf.isPending}
                    onClick={() =>
                      downloadPdf.mutate({ id: detail.id, periodEnd: detail.periodEnd })
                    }
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
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

              {detail.status === 'ISSUED' && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <p className="text-xs text-muted-foreground">
                    {detail.emailSentAt
                      ? `Emailed to you on ${formatDate(detail.emailSentAt)}.`
                      : detail.emailError
                        ? `Not emailed yet. ${detail.emailError}.`
                        : 'Not emailed yet.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      className="gap-2"
                      variant="outline"
                      rounded="md"
                      isLoading={downloadPdf.isPending}
                      onClick={() =>
                        downloadPdf.mutate({ id: detail.id, periodEnd: detail.periodEnd })
                      }
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                    <Button
                      className="gap-2"
                      variant="outline"
                      rounded="md"
                      isLoading={resendEmail.isPending}
                      onClick={() => resendEmail.mutate(detail.id)}
                    >
                      <Mail className="w-4 h-4" />
                      {detail.emailSentAt ? 'Resend email' : 'Send email'}
                    </Button>
                  </div>
                </div>
              )}

              {detail.status === 'ISSUED' &&
                (detail.payoutStatus === 'FAILED' || detail.payoutStatus === 'REJECTED') && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                    <p className="text-xs text-muted-foreground">
                      {detail.payoutStatus === 'REJECTED'
                        ? 'Held back by a second reviewer. Sending it again puts it back in front of them.'
                        : 'The transfer to your payout account didn’t go through.'}
                    </p>
                    <Button
                      className="gap-2"
                      variant="outline"
                      rounded="md"
                      isLoading={retryPayout.isPending}
                      onClick={() => retryPayout.mutate(detail.id)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      {detail.payoutStatus === 'REJECTED'
                        ? 'Send for approval again'
                        : 'Retry payout'}
                    </Button>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <UpgradeToProModal
        isOpen={planGate.isOpen}
        onClose={planGate.close}
        reason={planGate.reason}
      />
    </>
  );
}
